import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import * as argon2 from "argon2";
import { storage } from "./storage";
import { registerSchema, loginSchema, type User } from "@shared/schema";
import { z } from "zod";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function configureSession(app: Express) {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  app.use(
    session({
      secret: process.env.SESSION_SECRET!,
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // Allow cookies over HTTP for Replit development
        httpOnly: false, // Allow client-side access for Replit environment
        maxAge: sessionTtl,
        sameSite: "lax", // Less restrictive for cross-origin requests
        domain: undefined, // Let browser handle domain automatically
      },
    }),
  );
}

// Authentication middleware
export function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = (req.session as any).userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  req.userId = userId;
  next();
}

// Password hashing utilities
export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 1,
  });
}

export async function verifyPassword(
  hash: string,
  password: string,
): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}

// Auth routes
export function setupAuthRoutes(app: Express) {
  // Register endpoint
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      console.log("🔐 Registration attempt started for:", req.body?.username);

      const validatedData = registerSchema.parse(req.body);
      console.log("✅ Registration data validated successfully");

      // Check if username already exists (case-insensitive)
      console.log(
        "🔍 Checking if username exists:",
        validatedData.username.toLowerCase(),
      );
      const existingUser = await storage.getUserByUsername(
        validatedData.username.toLowerCase(),
      );
      if (existingUser) {
        console.log("❌ Username already exists:", validatedData.username);
        return res.status(400).json({ message: "Username already exists" });
      }
      console.log("✅ Username is available");

      // Hash password
      console.log("🔒 Hashing password...");
      const passwordHash = await hashPassword(validatedData.password);
      console.log("✅ Password hashed successfully");

      // Create user
      console.log("👤 Creating new user...");
      const newUser = await storage.createUser({
        username: validatedData.username.toLowerCase(),
        fullName: validatedData.fullName,
        email: validatedData.email,
        passwordHash,
      });
      console.log("✅ User created successfully with ID:", newUser.id);

      // Set session and save it before responding
      console.log("💾 Setting session...");
      (req.session as any).userId = newUser.id;

      req.session.save((err) => {
        if (err) {
          console.error("❌ Session save error:", err);
          return res
            .status(500)
            .json({ message: "Registration failed - session error" });
        }

        console.log("✅ Session saved successfully");
        // Return user without password
        const { passwordHash: _, ...userWithoutPassword } = newUser;
        console.log(
          "🎉 Registration completed successfully for user:",
          newUser.username,
        );
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("❌ Validation error:", error.errors);
        return res.status(400).json({
          message: "Invalid registration data",
          errors: error.errors,
        });
      }
      console.error("❌ Registration error:", error);
      console.error(
        "Error details:",
        error instanceof Error ? error.message : String(error),
      );
      console.error(
        "Error stack:",
        error instanceof Error ? error.stack : "No stack trace",
      );
      res.status(500).json({ message: "Registration failed - server error" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const validatedData = loginSchema.parse(req.body);

      // Get user by username (case-insensitive)
      const user = await storage.getUserByUsername(
        validatedData.username.toLowerCase(),
      );
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await verifyPassword(
        user.passwordHash,
        validatedData.password,
      );
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set session and save it before responding
      (req.session as any).userId = user.id;

      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Login failed" });
        }

        // Return user without password
        const { passwordHash: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid login data",
          errors: error.errors,
        });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user endpoint
  app.get(
    "/api/auth/user",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const user = await storage.getUser(req.userId!);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Return user without password
        const { passwordHash: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Failed to fetch user" });
      }
    },
  );
}
