import express from "express";
import cors from "cors";
import path from "path";
import "dotenv/config";

import cpRoutes from "./routes/cp";
import partDefinitionRoutes from "./routes/partDefinition";
import folderRoutes from "./routes/folder";

const app = express();
const PORT = process.env.PORT ?? 3001;

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static file serving for uploaded GLB files ────────────────────────────────
// e.g. GET /uploads/glb/filename.glb
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use("/api/cps", cpRoutes);
app.use("/api/part-definitions", partDefinitionRoutes);
app.use("/api/folders", folderRoutes);

// ── Health check ───────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── 404 catch-all ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`   API:     http://localhost:${PORT}/api`);
  console.log(`   Health:  http://localhost:${PORT}/api/health`);
});

export default app;
