import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

const defaults = {
  displayName: "Administrator",
  email: "",
  timezone: "UTC",
  theme: "system",
  notificationsEnabled: true,
  maintenanceMode: false
};

export async function getWorkspaceSettings(_req: Request, res: Response) {
  try {
    const settings = await prisma.adminWorkspaceSettings.upsert({
      where: { key: "singleton" },
      update: {},
      create: { key: "singleton", ...defaults }
    });
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error instanceof Error ? error.message : "Unable to load workspace settings." }
    });
  }
}

export async function updateWorkspaceSettings(req: Request, res: Response) {
  const body = req.body ?? {};
  const data: Record<string, unknown> = {};

  if (body.displayName !== undefined) {
    if (typeof body.displayName !== "string" || !body.displayName.trim()) {
      return void res.status(400).json({ success: false, error: { message: "displayName must be a non-empty string." } });
    }
    data.displayName = body.displayName.trim();
  }
  if (body.email !== undefined) {
    if (typeof body.email !== "string") {
      return void res.status(400).json({ success: false, error: { message: "email must be a string." } });
    }
    data.email = body.email.trim();
  }
  if (body.timezone !== undefined) {
    if (typeof body.timezone !== "string" || !body.timezone.trim()) {
      return void res.status(400).json({ success: false, error: { message: "timezone must be a non-empty string." } });
    }
    data.timezone = body.timezone.trim();
  }
  if (body.theme !== undefined) {
    if (!["light", "dark", "system"].includes(String(body.theme))) {
      return void res.status(400).json({ success: false, error: { message: "theme must be light, dark or system." } });
    }
    data.theme = body.theme;
  }
  for (const key of ["notificationsEnabled", "maintenanceMode"]) {
    if (body[key] !== undefined) {
      if (typeof body[key] !== "boolean") {
        return void res.status(400).json({ success: false, error: { message: `${key} must be a boolean.` } });
      }
      data[key] = body[key];
    }
  }

  if (!Object.keys(data).length) {
    return void res.status(400).json({ success: false, error: { message: "No valid settings supplied." } });
  }

  try {
    const settings = await prisma.adminWorkspaceSettings.upsert({
      where: { key: "singleton" },
      update: data,
      create: { key: "singleton", ...defaults, ...data }
    });
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error instanceof Error ? error.message : "Unable to update workspace settings." }
    });
  }
}
