import type { RequestHandler } from "express";
import crypto from "node:crypto";

const unauthorized = (res: Parameters<RequestHandler>[1]) => {
  res.setHeader("WWW-Authenticate", 'Bearer realm="admin"');
  res.status(401).json({
    success: false,
    error: { message: "Unauthorized." }
  });
};

export const requireAdminAuth: RequestHandler = (req, res, next) => {
  const expectedToken = process.env.ADMIN_API_TOKEN;

  if (!expectedToken) {
    console.error("ADMIN_API_TOKEN is not configured; refusing admin access.");
    res.status(503).json({
      success: false,
      error: { message: "Admin authentication is not configured." }
    });
    return;
  }

  const authorization = req.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  const suppliedToken = match?.[1]?.trim();

  if (!suppliedToken) {
    unauthorized(res);
    return;
  }

  const supplied = Buffer.from(suppliedToken, "utf8");
  const expected = Buffer.from(expectedToken, "utf8");

  if (
    supplied.length !== expected.length ||
    !crypto.timingSafeEqual(supplied, expected)
  ) {
    unauthorized(res);
    return;
  }

  next();
};
