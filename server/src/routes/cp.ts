import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// GET /api/cps — list all CPs with their assigned PD
router.get("/", async (_req: Request, res: Response) => {
  try {
    const cps = await prisma.cP.findMany({
      include: { partDefinition: true },
      orderBy: { createdAt: "asc" },
    });
    res.json(cps);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch CPs", details: String(err) });
  }
});

// GET /api/cps/:id — get a single CP
router.get("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const cp = await prisma.cP.findUnique({
      where: { id },
      include: { partDefinition: true },
    });
    if (!cp) {
      res.status(404).json({ error: "CP not found" });
      return;
    }
    res.json(cp);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch CP", details: String(err) });
  }
});

// POST /api/cps — create a CP
router.post("/", async (req: Request, res: Response) => {
  const { name, description, partDefinitionId, folderId } = req.body as {
    name: string;
    description?: string;
    partDefinitionId?: number;
    folderId?: number | null;
  };

  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "name is required" });
    return;
  }

  try {
    const cp = await prisma.cP.create({
      data: {
        name: name.trim(),
        description: description?.trim() ?? null,
        partDefinitionId: partDefinitionId ?? null,
        folderId: folderId ?? null,
      },
      include: { partDefinition: true },
    });
    res.status(201).json(cp);
  } catch (err: any) {
    if (err?.code === "P2002") {
      res.status(409).json({ error: `A CP named "${name}" already exists` });
      return;
    }
    res
      .status(500)
      .json({ error: "Failed to create CP", details: String(err) });
  }
});

// PUT /api/cps/:id — update a CP (name, description, or assign/unassign PD)
router.put("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, description, partDefinitionId, folderId } = req.body as {
    name?: string;
    description?: string;
    partDefinitionId?: number | null;
    folderId?: number | null;
  };

  try {
    const cp = await prisma.cP.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(partDefinitionId !== undefined && { partDefinitionId }),
        ...(folderId !== undefined && { folderId }),
      },
      include: { partDefinition: true },
    });
    res.json(cp);
  } catch (err: any) {
    if (err?.code === "P2025") {
      res.status(404).json({ error: "CP not found" });
      return;
    }
    if (err?.code === "P2002") {
      res.status(409).json({ error: `A CP named "${name}" already exists` });
      return;
    }
    res
      .status(500)
      .json({ error: "Failed to update CP", details: String(err) });
  }
});

// DELETE /api/cps/:id — delete a CP
router.delete("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await prisma.cP.delete({ where: { id } });
    res.status(204).send();
  } catch (err: any) {
    if (err?.code === "P2025") {
      res.status(404).json({ error: "CP not found" });
      return;
    }
    res
      .status(500)
      .json({ error: "Failed to delete CP", details: String(err) });
  }
});

export default router;
