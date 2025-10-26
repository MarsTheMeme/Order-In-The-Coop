import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import * as argon2 from "argon2";
import { storage } from "./storage";
import { registerSchema, loginSchema } from "@shared/schema";
import { z } from "zod";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function configureSession(app: Express) {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
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
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: sessionTtl,
        sameSite: "lax",
        domain: undefined,
      },
    }),
  );
}

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

export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
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

export function setupAuthRoutes(app: Express) {
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      console.log("🔐 Registration attempt for:", req.body?.username);

      const validatedData = registerSchema.parse(req.body);
      console.log("✅ Registration data validated");

      const existingUser = await storage.getUserByUsername(
        validatedData.username.toLowerCase(),
      );
      if (existingUser) {
        console.log("❌ Username already exists:", validatedData.username);
        return res.status(400).json({ message: "Username already exists" });
      }
      console.log("✅ Username is available");

      console.log("🔒 Hashing password...");
      const passwordHash = await hashPassword(validatedData.password);
      console.log("✅ Password hashed");

      console.log("👤 Creating new user...");
      const newUser = await storage.createUser({
        username: validatedData.username.toLowerCase(),
        fullName: validatedData.fullName,
        email: validatedData.email,
        passwordHash,
      });
      console.log("✅ User created with ID:", newUser.id);

      req.session.regenerate((err) => {
        if (err) {
          console.error("❌ Session regeneration error:", err);
          return res
            .status(500)
            .json({ message: "Registration failed - session error" });
        }

        console.log("💾 Setting session...");
        (req.session as any).userId = newUser.id;

        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("❌ Session save error:", saveErr);
            return res
              .status(500)
              .json({ message: "Registration failed - session error" });
          }

          console.log("✅ Session saved");
          const { passwordHash: _, ...userWithoutPassword } = newUser;
          console.log("🎉 Registration completed for:", newUser.username);
          res.status(201).json(userWithoutPassword);
        });
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
      res.status(500).json({ message: "Registration failed - server error" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const validatedData = loginSchema.parse(req.body);

      const user = await storage.getUserByUsername(
        validatedData.username.toLowerCase(),
      );
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await verifyPassword(
        user.passwordHash,
        validatedData.password,
      );
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ message: "Login failed" });
        }

        (req.session as any).userId = user.id;

        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ message: "Login failed" });
          }

          const { passwordHash: _, ...userWithoutPassword } = user;
          res.json(userWithoutPassword);
        });
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

  app.get(
    "/api/auth/user",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const user = await storage.getUser(req.userId!);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const { passwordHash: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Failed to fetch user" });
      }
    },
  );
}
