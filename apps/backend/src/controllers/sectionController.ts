import type { NextFunction, Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../lib/prisma";

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

const sendServerError = (res: Response, error: unknown): void => {
  console.error(error);
  res.status(500).json({
    success: false,
    error: {
      message: "Internal server error."
    }
  });
};

export const getPublicSections: AsyncHandler = async (_req, res) => {
  try {
    const sections = await prisma.cMSSection.findMany({
      where: { isVisible: true },
      orderBy: { order: "asc" }
    });

    res.status(200).json({
      success: true,
      data: sections
    });
  } catch (error) {
    sendServerError(res, error);
  }
};

export const getAdminSections: AsyncHandler = async (_req, res) => {
  try {
    const sections = await prisma.cMSSection.findMany({
      orderBy: { order: "asc" }
    });

    res.status(200).json({
      success: true,
      data: sections
    });
  } catch (error) {
    sendServerError(res, error);
  }
};

export const updateSection: AsyncHandler = async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body ?? {};

  if (!id) {
    res.status(400).json({
      success: false,
      error: { message: "Section id is required." }
    });
    return;
  }

  if (title === undefined && content === undefined) {
    res.status(400).json({
      success: false,
      error: { message: "At least one of title or content is required." }
    });
    return;
  }

  if (title !== undefined && (typeof title !== "string" || title.trim().length === 0)) {
    res.status(400).json({
      success: false,
      error: { message: "title must be a non-empty string when provided." }
    });
    return;
  }

  if (content !== undefined && content === null) {
    res.status(400).json({
      success: false,
      error: { message: "content must be a valid JSON value and cannot be null." }
    });
    return;
  }

  try {
    const data: Prisma.CMSSectionUpdateInput = {};

    if (title !== undefined) {
      data.title = title.trim();
    }

    if (content !== undefined) {
      data.content = content as Prisma.InputJsonValue;
    }

    const section = await prisma.cMSSection.update({
      where: { id },
      data
    });

    res.status(200).json({
      success: true,
      data: section
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({
        success: false,
        error: { message: "Section not found." }
      });
      return;
    }

    sendServerError(res, error);
  }
};

export const toggleSectionVisibility: AsyncHandler = async (req, res) => {
  const { id } = req.params;
  const { isVisible } = req.body ?? {};

  if (!id) {
    res.status(400).json({
      success: false,
      error: { message: "Section id is required." }
    });
    return;
  }

  if (typeof isVisible !== "boolean") {
    res.status(400).json({
      success: false,
      error: { message: "isVisible must be a boolean." }
    });
    return;
  }

  try {
    const section = await prisma.cMSSection.update({
      where: { id },
      data: { isVisible }
    });

    res.status(200).json({
      success: true,
      data: section
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({
        success: false,
        error: { message: "Section not found." }
      });
      return;
    }

    sendServerError(res, error);
  }
};
