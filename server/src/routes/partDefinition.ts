import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { prisma } from "../lib/prisma";

// ── Storage config ────────────────────────────────────────────────────────────
const glbDir = path.resolve(__dirname, "../../uploads/glb");
if (!fs.existsSync(glbDir)) fs.mkdirSync(glbDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, glbDir),
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${timestamp}-${safe}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === "model/gltf-binary" ||
      file.originalname.toLowerCase().endsWith(".glb")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only .glb files are accepted"));
    }
  },
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max
});

const router = Router();

// GET /api/part-definitions — list all PDs
router.get("/", async (_req: Request, res: Response) => {
  try {
    const pds = await prisma.partDefinition.findMany({
      include: { cps: true },
      orderBy: { createdAt: "asc" },
    });
    res.json(pds);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch PartDefinitions", details: String(err) });
  }
});

// GET /api/part-definitions/:id — get one PD
router.get("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const pd = await prisma.partDefinition.findUnique({
      where: { id },
      include: { cps: true },
    });
    if (!pd) {
      res.status(404).json({ error: "PartDefinition not found" });
      return;
    }
    res.json(pd);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch PartDefinition", details: String(err) });
  }
});

// POST /api/part-definitions — create a PD
router.post("/", async (req: Request, res: Response) => {
  const { name, description, folderId } = req.body as {
    name: string;
    description?: string;
    folderId?: number | null;
  };

  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "name is required" });
    return;
  }

  try {
    const pd = await prisma.partDefinition.create({
      data: {
        name: name.trim(),
        description: description?.trim() ?? null,
        folderId: folderId ?? null,
      },
    });
    res.status(201).json(pd);
  } catch (err: any) {
    if (err?.code === "P2002") {
      res
        .status(409)
        .json({ error: `A PartDefinition named "${name}" already exists` });
      return;
    }
    res
      .status(500)
      .json({ error: "Failed to create PartDefinition", details: String(err) });
  }
});

// PUT /api/part-definitions/:id — update a PD
router.put("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, description, folderId } = req.body as {
    name?: string;
    description?: string;
    folderId?: number | null;
  };

  try {
    const pd = await prisma.partDefinition.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(folderId !== undefined && { folderId }),
      },
    });
    res.json(pd);
  } catch (err: any) {
    if (err?.code === "P2025") {
      res.status(404).json({ error: "PartDefinition not found" });
      return;
    }
    if (err?.code === "P2002") {
      res
        .status(409)
        .json({ error: `A PartDefinition named "${name}" already exists` });
      return;
    }
    res
      .status(500)
      .json({ error: "Failed to update PartDefinition", details: String(err) });
  }
});

// DELETE /api/part-definitions/:id — delete a PD
// Note: CPs that reference this PD will have their partDefinitionId set to NULL (onDelete: SetNull)
router.delete("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    // Remove the GLB file from disk if one exists
    const pd = await prisma.partDefinition.findUnique({ where: { id } });
    if (pd?.glbPath) {
      const filePath = path.resolve(__dirname, "../../uploads", pd.glbPath);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await prisma.partDefinition.delete({ where: { id } });
    res.status(204).send();
  } catch (err: any) {
    if (err?.code === "P2025") {
      res.status(404).json({ error: "PartDefinition not found" });
      return;
    }
    res
      .status(500)
      .json({ error: "Failed to delete PartDefinition", details: String(err) });
  }
});

// POST /api/part-definitions/:id/upload-glb — upload / replace the GLB file
router.post(
  "/:id/upload-glb",
  upload.single("glb"),
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const file = req.file;

    if (!file) {
      res
        .status(400)
        .json({ error: "No GLB file provided. Use field name 'glb'." });
      return;
    }

    try {
      // Delete old GLB if one exists
      const existing = await prisma.partDefinition.findUnique({
        where: { id },
      });
      if (!existing) {
        // Remove the just-uploaded file and bail
        fs.unlinkSync(file.path);
        res.status(404).json({ error: "PartDefinition not found" });
        return;
      }
      if (existing.glbPath) {
        const oldPath = path.resolve(
          __dirname,
          "../../uploads",
          existing.glbPath,
        );
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      // Relative path stored in DB (relative to /uploads root for static serving)
      const relativePath = `glb/${file.filename}`;

      const pd = await prisma.partDefinition.update({
        where: { id },
        data: { glbPath: relativePath },
      });
      res.json({
        message: "GLB uploaded successfully",
        glbPath: relativePath,
        glbUrl: `/uploads/${relativePath}`,
        partDefinition: pd,
      });
    } catch (err) {
      // Clean up uploaded file on error
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      res
        .status(500)
        .json({ error: "Failed to upload GLB", details: String(err) });
    }
  },
);

// DELETE /api/part-definitions/:id/glb — remove the GLB from a PD without deleting the PD
router.delete("/:id/glb", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const pd = await prisma.partDefinition.findUnique({ where: { id } });
    if (!pd) {
      res.status(404).json({ error: "PartDefinition not found" });
      return;
    }
    if (pd.glbPath) {
      const filePath = path.resolve(__dirname, "../../uploads", pd.glbPath);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    const updated = await prisma.partDefinition.update({
      where: { id },
      data: { glbPath: null },
    });
    res.json({ message: "GLB removed", partDefinition: updated });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to remove GLB", details: String(err) });
  }
});

export default router;
