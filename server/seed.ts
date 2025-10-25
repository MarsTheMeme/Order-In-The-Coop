import { db } from "./db";
import { cases } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  const existingCases = await db.select().from(cases);
  
  if (existingCases.length === 0) {
    await db.insert(cases).values([
      {
        name: "Johnson v. MegaCorp",
        caseNumber: "CV-2024-001234",
        status: "active",
      },
      {
        name: "Smith Medical Malpractice",
        caseNumber: "CV-2024-005678",
        status: "active",
      },
      {
        name: "Rodriguez Employment Dispute",
        caseNumber: "CV-2024-009012",
        status: "active",
      },
    ]);
    console.log("Seed data inserted successfully");
  } else {
    console.log("Database already has cases, skipping seed");
  }

  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
