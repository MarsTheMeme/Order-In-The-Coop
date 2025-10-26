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
import { analyzeDocument, analyzeMultipleDocuments, chatWithTender } from "./gemini";
import { uploadFile, getFileUrl, deleteFile } from "./objectStorage";
import { isAuthenticated } from "./auth";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

const upload = multer({ storage: multer.memoryStorage() });

async function extractTextFromFile(file: Express.Multer.File): Promise<string> {
  const fileType = file.mimetype;
  
  if (fileType === "application/pdf") {
    try {
      const pdfParseModule: any = await import("pdf-parse");
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
  } else if (
    fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    fileType === "application/vnd.ms-excel" ||
    fileType === "text/csv"
  ) {
    try {
      const workbook = XLSX.read(file.buffer, { type: "buffer" });
      let textOutput = "";
      
      workbook.SheetNames.forEach((sheetName, index) => {
        const worksheet = workbook.Sheets[sheetName];
        if (index > 0) textOutput += "\n\n";
        textOutput += `=== Sheet: ${sheetName} ===\n`;
        
        const csvData = XLSX.utils.sheet_to_csv(worksheet);
        textOutput += csvData;
      });
      
      return textOutput;
    } catch (error) {
      console.error("Excel/CSV parsing error:", error);
      throw new Error("Failed to parse Excel/CSV file");
    }
  } else if (fileType.startsWith("text/")) {
    return file.buffer.toString("utf-8");
  } else {
    return file.buffer.toString("utf-8");
  }
}

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);
  
  app.get("/api/cases", isAuthenticated, async (_req: Request, res: Response) => {
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

  app.post("/api/cases", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const data = insertCaseSchema.parse(req.body);
      const [newCase] = await db.insert(cases).values(data).returning();
      res.json(newCase);
    } catch (error: any) {
      console.error("Error creating case:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/cases/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const caseId = parseInt(req.params.id);
      
      const caseDocuments = await db
        .select()
        .from(documents)
        .where(eq(documents.caseId, caseId));
      
      for (const doc of caseDocuments) {
        await deleteFile(doc.storageUrl);
      }
      
      await db.delete(cases).where(eq(cases.id, caseId));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting case:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/cases/:id/messages", isAuthenticated, async (req: Request, res: Response) => {
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

  app.post("/api/cases/:id/messages", isAuthenticated, async (req: Request, res: Response) => {
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
    isAuthenticated,
    upload.array("files"),
    async (req: Request, res: Response) => {
      try {
        const caseId = parseInt(req.params.id);
        
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
          return res.status(400).json({ error: "No files uploaded" });
        }

        console.log("[DEBUG] req.body:", req.body);
        console.log("[DEBUG] req.body.userInstructions:", req.body.userInstructions);
        console.log(`[DEBUG] Received ${req.files.length} file(s)`);
        const userInstructions = req.body.userInstructions?.trim() || undefined;
        console.log("[DEBUG] Extracted userInstructions:", userInstructions);

        const fileInfos: Array<{ fileName: string; text: string; buffer?: Buffer; mimeType: string }> = [];
        const documentRecords: any[] = [];

        for (const file of req.files) {
          const fileUrl = await uploadFile(file);

          const [document] = await db
            .insert(documents)
            .values({
              caseId,
              fileName: file.originalname,
              fileType: file.mimetype,
              fileSize: file.size,
              storageUrl: fileUrl,
            })
            .returning();

          documentRecords.push(document);

          const isPDF = file.mimetype === "application/pdf";
          
          if (isPDF) {
            fileInfos.push({
              fileName: file.originalname,
              text: "",
              buffer: file.buffer,
              mimeType: file.mimetype
            });
          } else {
            const documentText = await extractTextFromFile(file);
            if (!documentText || documentText.trim().length < 50) {
              return res.status(400).json({ 
                error: `Could not extract text from ${file.originalname}. Please ensure the document contains readable text.` 
              });
            }
            fileInfos.push({
              fileName: file.originalname,
              text: documentText,
              mimeType: file.mimetype
            });
          }
        }

        const fileNames = req.files.map(f => f.originalname).join(", ");
        const uploadMessage = userInstructions
          ? `Uploaded ${req.files.length} document${req.files.length > 1 ? 's' : ''}: ${fileNames}\nInstructions: ${userInstructions}`
          : `Uploaded ${req.files.length} document${req.files.length > 1 ? 's' : ''}: ${fileNames}`;

        await db
          .insert(chatMessages)
          .values({
            caseId,
            role: "user",
            content: uploadMessage,
            isAnalysis: false,
          });

        const analysis = await analyzeMultipleDocuments(
          fileInfos,
          userInstructions
        );
        console.log("[DEBUG] Batch analysis completed. Has conversational response:", !!analysis.conversationalResponse);

        const [extracted] = await db
          .insert(extractedData)
          .values({
            documentId: documentRecords[0].id,
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

        const analysisContent = analysis.conversationalResponse 
          ? analysis.conversationalResponse
          : `Analysis complete! I've extracted key information from ${req.files.length} document${req.files.length > 1 ? 's' : ''}. Please review the extracted data in the documents and approve or reject the suggested actions.`;

        const [analysisMessage] = await db
          .insert(chatMessages)
          .values({
            caseId,
            role: "assistant",
            content: analysisContent,
            isAnalysis: true,
          })
          .returning();

        res.json({
          documents: documentRecords,
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

  app.get("/api/cases/:id/extracted-data", isAuthenticated, async (req: Request, res: Response) => {
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

  app.get("/api/cases/:id/actions", isAuthenticated, async (req: Request, res: Response) => {
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

  app.patch("/api/actions/:id", isAuthenticated, async (req: Request, res: Response) => {
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

  app.delete("/api/actions/:id", isAuthenticated, async (req: Request, res: Response) => {
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

  app.get("/api/approvals", isAuthenticated, async (_req: Request, res: Response) => {
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

  app.get("/api/deadlines", isAuthenticated, async (req: Request, res: Response) => {
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
