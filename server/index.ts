import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo.js";
import { handleDeploy, handleCheckSecurity } from "./routes/deploy.js";
import { handleAdvancedDeploy } from "./routes/advanced-deploy.js";
import {
  handleSignup,
  handleLogin,
  handleGetCurrentUser,
  handleLogout,
  handleUpdateUsername,
  handleUpdateEmail,
  handleUpdatePassword,
  handleDeleteAccount,
} from "./routes/auth.js";
import {
  handleGetDeployments,
  handleGetDeploymentYaml,
  handleDeleteDeployment,
} from "./routes/deployments.js";
import { authMiddleware } from "./auth.js";
import { initializeDatabase } from "./db.js";

export async function createServer() {
  const app = express();

  // Log Kubernetes environment at startup
  console.log("=== Kubernetes Environment Detection ===");
  console.log(`KUBERNETES_SERVICE_HOST: ${process.env.KUBERNETES_SERVICE_HOST || "NOT SET"}`);
  console.log(`KUBERNETES_SERVICE_PORT: ${process.env.KUBERNETES_SERVICE_PORT || "NOT SET"}`);
  console.log(`KUBERNETES_SERVICE_PROTOCOL: ${process.env.KUBERNETES_SERVICE_PROTOCOL || "NOT SET"}`);

  const inCluster = process.env.KUBERNETES_SERVICE_HOST && process.env.KUBERNETES_SERVICE_PORT;
  console.log(`In-Cluster Detection: ${inCluster ? "YES ✓" : "NO ✗"}`);
  console.log("=====================================\n");

  // Initialize database (non-blocking)
  initializeDatabase().catch((error) => {
    console.error("Database initialization error:", error);
  });

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // Security headers
  app.use((req, res, next) => {
    // Prevent clickjacking
    res.setHeader("X-Frame-Options", "DENY");

    // Prevent MIME type sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");

    // Enable XSS protection
    res.setHeader("X-XSS-Protection", "1; mode=block");

    // Prevent opening in iframe from external sites
    res.setHeader("X-Frame-Options", "SAMEORIGIN");

    // Referrer policy
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    // Feature policy
    res.setHeader(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=()",
    );

    next();
  });

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

  // Protected auth routes
  app.get("/api/auth/me", authMiddleware, handleGetCurrentUser);
  app.put("/api/auth/profile/username", authMiddleware, handleUpdateUsername);
  app.put("/api/auth/profile/email", authMiddleware, handleUpdateEmail);
  app.put("/api/auth/profile/password", authMiddleware, handleUpdatePassword);
  app.delete("/api/auth/profile", authMiddleware, handleDeleteAccount);

  // Protected deployment routes
  app.post("/api/deploy", authMiddleware, handleDeploy);
  app.post("/api/deploy-advanced", authMiddleware, handleAdvancedDeploy);
  app.post("/api/check-security", authMiddleware, handleCheckSecurity);

  // Protected deployments management routes
  app.get("/api/deployments", authMiddleware, handleGetDeployments);
  app.get(
    "/api/deployments/:deploymentId/yaml",
    authMiddleware,
    handleGetDeploymentYaml,
  );
  app.delete(
    "/api/deployments/:deploymentId",
    authMiddleware,
    handleDeleteDeployment,
  );

  return app;
}
