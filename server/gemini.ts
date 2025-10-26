import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}

const genAI = new GoogleGenAI({ apiKey });

export interface DocumentAnalysis {
  caseNumber?: string;
  parties?: string[];
  deadlines?: Array<{
    date: string;
    description: string;
    priority: "high" | "medium" | "low";
  }>;
  keyFacts?: string[];
  confidence: number;
  suggestedActions: Array<{
    title: string;
    description: string;
    rationale: string;
    priority: "high" | "medium" | "low";
  }>;
  conversationalResponse?: string;
}

export async function analyzeDocument(
  documentText: string,
  fileName: string,
  userInstructions?: string,
  pdfBuffer?: Buffer
): Promise<DocumentAnalysis> {
  const instructionsSection = userInstructions 
    ? `\n\nUSER'S SPECIFIC INSTRUCTIONS: ${userInstructions}\nPay special attention to these instructions while analyzing the document. Tailor your extraction and suggested actions to address what the user is asking for.\n`
    : '';

  const basePrompt = `You are Tender, an AI legal assistant helping plaintiff legal teams process case documents.${instructionsSection}

Analyze the following legal document and extract:

1. Case Number (if mentioned)
2. Parties Involved (plaintiff, defendant, counsel, witnesses)
3. Critical Deadlines (dates with descriptions and priority: high/medium/low)
4. Key Facts (important facts, evidence, or testimony)
5. Suggested Actions (specific next steps the legal team should take)

${pdfBuffer ? 'This document may contain images, photos, diagrams, or visual evidence. Analyze ALL visual content along with text to extract comprehensive information.' : ''}

For each suggested action, provide:
- A clear title
- Detailed description
- Rationale explaining why this action is important
- Priority level (high/medium/low)

Return your analysis in valid JSON format with this structure:
{
  "caseNumber": "string or null",
  "parties": ["string array"],
  "deadlines": [{"date": "string", "description": "string", "priority": "high|medium|low"}],
  "keyFacts": ["string array"],
  "confidence": 0.0-1.0,
  "suggestedActions": [{
    "title": "string",
    "description": "string", 
    "rationale": "string",
    "priority": "high|medium|low"
  }]
}

Document: ${fileName}

Provide only the JSON response, no other text.`;

  let contents: any;
  
  if (pdfBuffer) {
    console.log(`[PDF Vision] Processing PDF with embedded images: ${fileName}`);
    contents = [
      { text: basePrompt },
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: pdfBuffer.toString('base64')
        }
      }
    ];
  } else {
    contents = `${basePrompt}\n---\n${documentText}\n---`;
  }

  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents,
  });
  
  const text = result.text || "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to extract JSON from AI response");
  }

  const analysis: DocumentAnalysis = JSON.parse(jsonMatch[0]);
  
  if (!analysis.confidence) {
    analysis.confidence = 0.85;
  }

  if (userInstructions) {
    console.log("[DEBUG] User provided instructions:", userInstructions);
    const responsePrompt = `You are Tender, an AI legal assistant. A user just uploaded a document and asked you to: "${userInstructions}"

Based on the analysis you performed, here's what you found:
- Case Number: ${analysis.caseNumber || "Not found"}
- Parties: ${analysis.parties?.join(", ") || "Not found"}
- Deadlines: ${analysis.deadlines?.map(d => `${d.description} (${d.date})`).join(", ") || "Not found"}
- Key Facts: ${analysis.keyFacts?.slice(0, 3).join("; ") || "Not found"}

Provide a helpful, conversational response that directly answers the user's request. Be specific and reference the information you found. If you found the information they asked for, present it clearly. If not, explain what you did find. Keep it concise and professional.`;

    console.log("[DEBUG] Generating conversational response...");
    const responseResult = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: responsePrompt,
    });

    analysis.conversationalResponse = responseResult.text || "";
    console.log("[DEBUG] Conversational response generated:", analysis.conversationalResponse?.substring(0, 100));
  }

  return analysis;
}

export interface FileInfo {
  fileName: string;
  text: string;
  buffer?: Buffer;
  mimeType: string;
}

export async function analyzeMultipleDocuments(
  files: FileInfo[],
  userInstructions?: string
): Promise<DocumentAnalysis> {
  const instructionsSection = userInstructions 
    ? `\n\nUSER'S SPECIFIC INSTRUCTIONS: ${userInstructions}\nPay special attention to these instructions while analyzing the documents. Tailor your extraction and suggested actions to address what the user is asking for.\n`
    : '';

  const basePrompt = `You are Tender, an AI legal assistant helping plaintiff legal teams process case documents.${instructionsSection}

Analyze the following ${files.length} legal document${files.length > 1 ? 's' : ''} and extract comprehensive information from ALL documents:

1. Case Number (if mentioned in any document)
2. Parties Involved (plaintiff, defendant, counsel, witnesses from all documents)
3. Critical Deadlines (dates with descriptions and priority: high/medium/low from all documents)
4. Key Facts (important facts, evidence, or testimony from all documents)
5. Suggested Actions (specific next steps based on information across all documents)

For PDF documents, analyze ALL visual content (images, photos, diagrams, charts) along with text to extract comprehensive information.

For each suggested action, provide:
- A clear title
- Detailed description
- Rationale explaining why this action is important
- Priority level (high/medium/low)

Return your analysis in valid JSON format with this structure:
{
  "caseNumber": "string or null",
  "parties": ["string array"],
  "deadlines": [{"date": "string", "description": "string", "priority": "high|medium|low"}],
  "keyFacts": ["string array"],
  "confidence": 0.0-1.0,
  "suggestedActions": [{
    "title": "string",
    "description": "string", 
    "rationale": "string",
    "priority": "high|medium|low"
  }]
}

Documents to analyze:
${files.map((f, i) => `\nDocument ${i + 1}: ${f.fileName}`).join('')}

Provide only the JSON response, no other text.`;

  let contents: any[] = [{ text: basePrompt }];
  
  for (const file of files) {
    if (file.buffer) {
      console.log(`[PDF Vision] Adding PDF to batch: ${file.fileName}`);
      contents.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.buffer.toString('base64')
        }
      });
    } else {
      contents.push({
        text: `\n--- ${file.fileName} ---\n${file.text}\n---`
      });
    }
  }

  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents,
  });
  
  const text = result.text || "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to extract JSON from AI response");
  }

  const analysis: DocumentAnalysis = JSON.parse(jsonMatch[0]);
  
  if (!analysis.confidence) {
    analysis.confidence = 0.85;
  }

  if (userInstructions) {
    console.log("[DEBUG] User provided instructions for batch analysis:", userInstructions);
    const fileList = files.map(f => f.fileName).join(", ");
    const responsePrompt = `You are Tender, an AI legal assistant. A user just uploaded ${files.length} document${files.length > 1 ? 's' : ''} (${fileList}) and asked you to: "${userInstructions}"

Based on the analysis you performed across all documents, here's what you found:
- Case Number: ${analysis.caseNumber || "Not found"}
- Parties: ${analysis.parties?.join(", ") || "Not found"}
- Deadlines: ${analysis.deadlines?.map(d => `${d.description} (${d.date})`).join(", ") || "Not found"}
- Key Facts: ${analysis.keyFacts?.slice(0, 5).join("; ") || "Not found"}

Provide a helpful, conversational response that directly answers the user's request. Mention that you analyzed all ${files.length} documents together. Be specific and reference the information you found. If you found the information they asked for, present it clearly. If not, explain what you did find. Keep it concise and professional.`;

    console.log("[DEBUG] Generating conversational response for batch...");
    const responseResult = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: responsePrompt,
    });

    analysis.conversationalResponse = responseResult.text || "";
    console.log("[DEBUG] Conversational response generated:", analysis.conversationalResponse?.substring(0, 100));
  }

  return analysis;
}

export async function chatWithTender(
  message: string,
  context?: string
): Promise<string> {
  const prompt = `You are Tender, a helpful AI legal assistant for plaintiff legal teams. You help analyze case documents, extract key information, and suggest actionable next steps.

${context ? `Context from recent analysis:\n${context}\n\n` : ""}User message: ${message}

Respond helpfully and professionally. If the user asks about document analysis, encourage them to upload documents. Keep responses concise and actionable.`;

  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  
  return result.text || "";
}

export interface CaseContext {
  caseName: string;
  caseNumber: string;
  documents: Array<{
    fileName: string;
    fileType: string;
    uploadedAt: Date;
  }>;
  extractedData: Array<{
    caseNumber?: string | null;
    parties: string[];
    deadlines: Array<{
      date: string;
      description: string;
      priority: string;
    }>;
    keyFacts: string[];
    documentFileName: string;
  }>;
}

export async function answerCaseQuestion(
  question: string,
  caseContext: CaseContext
): Promise<string> {
  const documentsInfo = caseContext.documents
    .map((d, i) => `${i + 1}. ${d.fileName} (${d.fileType})`)
    .join('\n');

  const extractedInfo = caseContext.extractedData.map(data => {
    const parts = [
      `Document: ${data.documentFileName}`,
      data.caseNumber ? `Case Number: ${data.caseNumber}` : null,
      data.parties.length > 0 ? `Parties: ${data.parties.join(', ')}` : null,
      data.deadlines.length > 0 
        ? `Deadlines:\n${data.deadlines.map(d => `  - ${d.description} (${d.date}) [${d.priority} priority]`).join('\n')}`
        : null,
      data.keyFacts.length > 0 
        ? `Key Facts:\n${data.keyFacts.map(f => `  - ${f}`).join('\n')}`
        : null
    ];
    return parts.filter(Boolean).join('\n');
  }).join('\n\n---\n\n');

  const prompt = `You are Tender, an AI legal assistant helping with case: "${caseContext.caseName}" (${caseContext.caseNumber}).

CASE DOCUMENTS (${caseContext.documents.length} total):
${documentsInfo}

EXTRACTED INFORMATION FROM DOCUMENTS:
${extractedInfo || 'No documents have been analyzed yet.'}

USER QUESTION: ${question}

Based on the case documents and extracted information above, provide a helpful, specific answer to the user's question. Reference specific documents, parties, dates, or facts when relevant. If the information needed to answer isn't in the case documents, say so clearly and suggest what additional documents might help.

Keep your response conversational, professional, and actionable. You're speaking directly to the legal team working on this case.`;

  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  
  return result.text || "I apologize, but I couldn't generate a response. Please try rephrasing your question.";
}
