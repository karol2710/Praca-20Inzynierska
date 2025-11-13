import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleDeploy } from "./routes/deploy";
import {
  handleSignup,
  handleLogin,
  handleGetCurrentUser,
  handleLogout,
} from "./routes/auth";
import { authMiddleware } from "./auth";
import { initializeDatabase } from "./db";

export async function createServer() {
  const app = express();

  // Initialize database
  try {
    await initializeDatabase();
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Auth routes (no auth required)
  app.post("/api/auth/signup", handleSignup);
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/logout", handleLogout);

  // Protected auth route
  app.get("/api/auth/me", authMiddleware, handleGetCurrentUser);

  // Protected deployment routes
  app.post("/api/deploy", authMiddleware, handleDeploy);

  return app;
}
