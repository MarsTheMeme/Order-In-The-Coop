import { pgTable, text, serial, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const cases = pgTable("cases", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  caseNumber: text("case_number").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull().references(() => cases.id),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  storageUrl: text("storage_url").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull().references(() => cases.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  isAnalysis: boolean("is_analysis").default(false),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const extractedData = pgTable("extracted_data", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().references(() => documents.id),
  caseNumber: text("case_number"),
  parties: jsonb("parties").$type<string[]>(),
  deadlines: jsonb("deadlines").$type<Array<{ date: string; description: string; priority: "high" | "medium" | "low" }>>(),
  keyFacts: jsonb("key_facts").$type<string[]>(),
  confidence: text("confidence"),
  extractedAt: timestamp("extracted_at").defaultNow().notNull(),
});

export const suggestedActions = pgTable("suggested_actions", {
  id: serial("id").primaryKey(),
  extractedDataId: integer("extracted_data_id").notNull().references(() => extractedData.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  rationale: text("rationale").notNull(),
  priority: text("priority").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCaseSchema = createInsertSchema(cases).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

export const insertExtractedDataSchema = createInsertSchema(extractedData).omit({
  id: true,
  extractedAt: true,
});

export const insertSuggestedActionSchema = createInsertSchema(suggestedActions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Case = typeof cases.$inferSelect;
export type InsertCase = z.infer<typeof insertCaseSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type ExtractedData = typeof extractedData.$inferSelect;
export type InsertExtractedData = z.infer<typeof insertExtractedDataSchema>;

export type SuggestedAction = typeof suggestedActions.$inferSelect;
export type InsertSuggestedAction = z.infer<typeof insertSuggestedActionSchema>;
