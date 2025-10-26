import { db } from "./db";
import { users } from "@shared/schema";
import argon2 from "argon2";

async function createTestUser() {
  try {
    const username = "testuser";
    const password = "password123";
    
    const passwordHash = await argon2.hash(password);
    
    const [user] = await db
      .insert(users)
      .values({
        username,
        passwordHash,
        fullName: "Test User",
      })
      .returning();
    
    console.log("✓ Test user created successfully:");
    console.log("  Username: testuser");
    console.log("  Password: password123");
    console.log("  Full Name: Test User");
    console.log("  User ID:", user.id);
  } catch (error: any) {
    if (error.code === "23505") {
      console.log("✓ Test user already exists");
      console.log("  Username: testuser");
      console.log("  Password: password123");
    } else {
      console.error("Error:", error.message);
    }
  }
  process.exit(0);
}

createTestUser();
