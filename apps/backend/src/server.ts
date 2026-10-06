import "dotenv/config";
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import sectionRoutes from "./routes/sectionRoutes.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);

if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error("PORT must be a valid TCP port.");
}

app.disable("x-powered-by");

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",").map((origin) => origin.trim()) ?? true,
    credentials: true
  })
);

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "ok"
  });
});

app.use("/api", sectionRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: "Route not found."
    }
  });
});

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error(error);

  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({
      success: false,
      error: {
        message: "Invalid JSON payload."
      }
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: {
      message: "Internal server error."
    }
  });
};

app.use(errorHandler);

app.listen(port, "0.0.0.0", () => {
  console.log(`Backend API listening on 0.0.0.0:${port}`);
});

export default app;
