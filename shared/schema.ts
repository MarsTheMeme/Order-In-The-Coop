import { pgTable, text, serial, timestamp, integer, jsonb, boolean, varchar, index } from "drizzle-orm/pg-core";
import { sql } from 'drizzle-orm';
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(),
  email: varchar("email"),
  passwordHash: varchar("password_hash").notNull(),
  fullName: varchar("full_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const cases = pgTable("cases", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  caseNumber: text("case_number").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  storageUrl: text("storage_url").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  isAnalysis: boolean("is_analysis").default(false),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const extractedData = pgTable("extracted_data", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  caseNumber: text("case_number"),
  parties: jsonb("parties").$type<string[]>(),
  deadlines: jsonb("deadlines").$type<Array<{ date: string; description: string; priority: "high" | "medium" | "low" }>>(),
  keyFacts: jsonb("key_facts").$type<string[]>(),
  confidence: text("confidence"),
  extractedAt: timestamp("extracted_at").defaultNow().notNull(),
});

export const suggestedActions = pgTable("suggested_actions", {
  id: serial("id").primaryKey(),
  extractedDataId: integer("extracted_data_id").notNull().references(() => extractedData.id, { onDelete: "cascade" }),
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
  userId: true,
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

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  fullName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  password: z.string().min(6).max(128),
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUser = z.infer<typeof registerSchema>;
export type LoginUser = z.infer<typeof loginSchema>;
export type User = typeof users.$inferSelect;
