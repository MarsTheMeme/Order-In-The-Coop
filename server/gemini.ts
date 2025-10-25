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
}

export async function analyzeDocument(
  documentText: string,
  fileName: string
): Promise<DocumentAnalysis> {
  const prompt = `You are Tender, an AI legal assistant helping plaintiff legal teams process case documents. 

Analyze the following legal document and extract:

1. Case Number (if mentioned)
2. Parties Involved (plaintiff, defendant, counsel, witnesses)
3. Critical Deadlines (dates with descriptions and priority: high/medium/low)
4. Key Facts (important facts, evidence, or testimony)
5. Suggested Actions (specific next steps the legal team should take)

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
---
${documentText}
---

Provide only the JSON response, no other text.`;

  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
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
