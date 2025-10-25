import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { 
  cases, 
  documents, 
  chatMessages, 
  extractedData, 
  suggestedActions,
  insertCaseSchema,
  insertDocumentSchema,
  insertChatMessageSchema,
  insertExtractedDataSchema,
  insertSuggestedActionSchema
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import multer from "multer";
import { analyzeDocument, chatWithTender } from "./gemini";
import { uploadFile, getFileUrl } from "./objectStorage";
import mammoth from "mammoth";

const upload = multer({ storage: multer.memoryStorage() });

async function extractTextFromFile(file: Express.Multer.File): Promise<string> {
  const fileType = file.mimetype;
  
  if (fileType === "application/pdf") {
    try {
      const pdfParseModule = await import("pdf-parse");
      const pdfParse = pdfParseModule.default || pdfParseModule;
      const data = await pdfParse(file.buffer);
      return data.text;
    } catch (error) {
      console.error("PDF parsing error:", error);
      throw new Error("Failed to parse PDF file");
    }
  } else if (
    fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileType === "application/msword"
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value;
  } else if (fileType.startsWith("text/")) {
    return file.buffer.toString("utf-8");
  } else {
    return file.buffer.toString("utf-8");
  }
}

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);
  
  app.get("/api/cases", async (_req: Request, res: Response) => {
    try {
      const allCases = await db.select().from(cases).orderBy(desc(cases.createdAt));
      
      const casesWithCounts = await Promise.all(
        allCases.map(async (c) => {
          const docs = await db.select().from(documents).where(eq(documents.caseId, c.id));
          const actions = await db
            .select()
            .from(suggestedActions)
            .innerJoin(extractedData, eq(suggestedActions.extractedDataId, extractedData.id))
            .innerJoin(documents, eq(extractedData.documentId, documents.id))
            .where(eq(documents.caseId, c.id));
          
          const pendingApprovals = actions.filter(
            (a) => a.suggested_actions.status === "pending"
          ).length;

          return {
            id: c.id.toString(),
            name: c.name,
            caseNumber: c.caseNumber,
            documentCount: docs.length,
            pendingApprovals,
          };
        })
      );

      res.json(casesWithCounts);
    } catch (error: any) {
      console.error("Error fetching cases:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/cases", async (req: Request, res: Response) => {
    try {
      const data = insertCaseSchema.parse(req.body);
      const [newCase] = await db.insert(cases).values(data).returning();
      res.json(newCase);
    } catch (error: any) {
      console.error("Error creating case:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/cases/:id/messages", async (req: Request, res: Response) => {
    try {
      const caseId = parseInt(req.params.id);
      const messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.caseId, caseId))
        .orderBy(chatMessages.timestamp);
      
      res.json(messages);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/cases/:id/messages", async (req: Request, res: Response) => {
    try {
      const caseId = parseInt(req.params.id);
      const data = insertChatMessageSchema.parse({ ...req.body, caseId });
      const [message] = await db.insert(chatMessages).values(data).returning();

      if (message.role === "user" && !message.content.toLowerCase().includes("uploaded:")) {
        const aiResponse = await chatWithTender(message.content);
        const [aiMessage] = await db
          .insert(chatMessages)
          .values({
            caseId,
            role: "assistant",
            content: aiResponse,
            isAnalysis: false,
          })
          .returning();
        
        res.json({ userMessage: message, aiMessage });
      } else {
        res.json({ userMessage: message });
      }
    } catch (error: any) {
      console.error("Error creating message:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.post(
    "/api/cases/:id/documents",
    upload.single("file"),
    async (req: Request, res: Response) => {
      try {
        const caseId = parseInt(req.params.id);
        
        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        const fileUrl = await uploadFile(req.file);

        const [document] = await db
          .insert(documents)
          .values({
            caseId,
            fileName: req.file.originalname,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            storageUrl: fileUrl,
          })
          .returning();

        await db
          .insert(chatMessages)
          .values({
            caseId,
            role: "user",
            content: `Uploaded document: ${req.file.originalname}`,
            isAnalysis: false,
          });

        const documentText = await extractTextFromFile(req.file);
        
        if (!documentText || documentText.trim().length < 50) {
          return res.status(400).json({ 
            error: "Could not extract text from document. Please ensure the document contains readable text." 
          });
        }

        const analysis = await analyzeDocument(documentText, req.file.originalname);

        const [extracted] = await db
          .insert(extractedData)
          .values({
            documentId: document.id,
            caseNumber: analysis.caseNumber,
            parties: analysis.parties || [],
            deadlines: analysis.deadlines || [],
            keyFacts: analysis.keyFacts || [],
            confidence: analysis.confidence.toString(),
          })
          .returning();

        const actionPromises = analysis.suggestedActions.map((action) =>
          db
            .insert(suggestedActions)
            .values({
              extractedDataId: extracted.id,
              title: action.title,
              description: action.description,
              rationale: action.rationale,
              priority: action.priority,
              status: "pending",
            })
            .returning()
        );

        const actions = await Promise.all(actionPromises);

        const [analysisMessage] = await db
          .insert(chatMessages)
          .values({
            caseId,
            role: "assistant",
            content: "Analysis complete! I've extracted key information from the document. Please review the extracted data below and approve or reject the suggested actions.",
            isAnalysis: true,
          })
          .returning();

        res.json({
          document,
          extracted: {
            ...extracted,
            confidence: parseFloat(extracted.confidence || "0"),
            deadlines: extracted.deadlines as any,
            parties: extracted.parties as any,
            keyFacts: extracted.keyFacts as any,
          },
          actions: actions.map((a) => a[0]),
          message: analysisMessage,
        });
      } catch (error: any) {
        console.error("Error uploading document:", error);
        res.status(500).json({ error: error.message });
      }
    }
  );

  app.get("/api/cases/:id/extracted-data", async (req: Request, res: Response) => {
    try {
      const caseId = parseInt(req.params.id);
      const data = await db
        .select({
          extracted: extractedData,
          document: documents,
        })
        .from(extractedData)
        .innerJoin(documents, eq(extractedData.documentId, documents.id))
        .where(eq(documents.caseId, caseId))
        .orderBy(desc(extractedData.extractedAt));
      
      res.json(data);
    } catch (error: any) {
      console.error("Error fetching extracted data:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/cases/:id/actions", async (req: Request, res: Response) => {
    try {
      const caseId = parseInt(req.params.id);
      const actions = await db
        .select({
          action: suggestedActions,
          extracted: extractedData,
          document: documents,
        })
        .from(suggestedActions)
        .innerJoin(extractedData, eq(suggestedActions.extractedDataId, extractedData.id))
        .innerJoin(documents, eq(extractedData.documentId, documents.id))
        .where(eq(documents.caseId, caseId))
        .orderBy(desc(suggestedActions.createdAt));
      
      res.json(actions.map((a) => a.action));
    } catch (error: any) {
      console.error("Error fetching actions:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/actions/:id", async (req: Request, res: Response) => {
    try {
      const actionId = parseInt(req.params.id);
      const { status } = req.body;

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const [updatedAction] = await db
        .update(suggestedActions)
        .set({ status, updatedAt: new Date() })
        .where(eq(suggestedActions.id, actionId))
        .returning();

      res.json(updatedAction);
    } catch (error: any) {
      console.error("Error updating action:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/actions/:id", async (req: Request, res: Response) => {
    try {
      const actionId = parseInt(req.params.id);

      const [deletedAction] = await db
        .delete(suggestedActions)
        .where(eq(suggestedActions.id, actionId))
        .returning();

      if (!deletedAction) {
        return res.status(404).json({ error: "Action not found" });
      }

      res.json({ success: true, action: deletedAction });
    } catch (error: any) {
      console.error("Error deleting action:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/approvals", async (_req: Request, res: Response) => {
    try {
      const approvedActions = await db
        .select({
          action: suggestedActions,
          extracted: extractedData,
          document: documents,
          case: cases,
        })
        .from(suggestedActions)
        .innerJoin(extractedData, eq(suggestedActions.extractedDataId, extractedData.id))
        .innerJoin(documents, eq(extractedData.documentId, documents.id))
        .innerJoin(cases, eq(documents.caseId, cases.id))
        .where(eq(suggestedActions.status, "approved"))
        .orderBy(desc(suggestedActions.updatedAt));
      
      res.json(approvedActions);
    } catch (error: any) {
      console.error("Error fetching approvals:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/deadlines", async (_req: Request, res: Response) => {
    try {
      const allExtractedData = await db
        .select({
          extracted: extractedData,
          document: documents,
          case: cases,
        })
        .from(extractedData)
        .innerJoin(documents, eq(extractedData.documentId, documents.id))
        .innerJoin(cases, eq(documents.caseId, cases.id));
      
      const deadlinesWithCases = allExtractedData.flatMap((item) => {
        const deadlines = item.extracted.deadlines as Array<{ date: string; description: string; priority: "high" | "medium" | "low" }> | null;
        
        if (!deadlines || !Array.isArray(deadlines)) {
          return [];
        }
        
        return deadlines.map((deadline) => ({
          ...deadline,
          caseName: item.case.name,
          caseId: item.case.id,
          caseNumber: item.case.caseNumber,
          documentName: item.document.fileName,
        }));
      });
      
      res.json(deadlinesWithCases);
    } catch (error: any) {
      console.error("Error fetching deadlines:", error);
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
