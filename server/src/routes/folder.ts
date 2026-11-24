import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// GET /api/folders?type=PD or CP
router.get("/", async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    if (type !== "PD" && type !== "CP") {
      return res
        .status(400)
        .json({ error: "Invalid folder type. Must be PD or CP" });
    }

    const folders = await prisma.folder.findMany({
      where: { type },
      orderBy: { name: "asc" },
    });

    res.json(folders);
  } catch (error: any) {
    res
      .status(500)
      .json({ error: "Failed to fetch folders", details: error.message });
  }
});

// POST /api/folders
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, type, parentId } = req.body;

    if (!name || (type !== "PD" && type !== "CP")) {
      return res
        .status(400)
        .json({ error: "Name and valid type (PD/CP) are required" });
    }

    const folder = await prisma.folder.create({
      data: {
        name,
        type,
        parentId: parentId || null,
      },
    });

    res.json(folder);
  } catch (error: any) {
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({
          error: "A folder with this name already exists in this location",
        });
    }
    res
      .status(500)
      .json({ error: "Failed to create folder", details: error.message });
  }
});

// PUT /api/folders/:id
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name, parentId } = req.body;

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (parentId !== undefined)
      data.parentId = parentId === null ? null : parentId;

    const folder = await prisma.folder.update({
      where: { id },
      data,
    });

    res.json(folder);
  } catch (error: any) {
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({
          error: "A folder with this name already exists in this location",
        });
    }
    res
      .status(500)
      .json({ error: "Failed to update folder", details: error.message });
  }
});

// DELETE /api/folders/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.folder.delete({
      where: { id },
    });
    res.json({ success: true });
  } catch (error: any) {
    res
      .status(500)
      .json({ error: "Failed to delete folder", details: error.message });
  }
});

export default router;
