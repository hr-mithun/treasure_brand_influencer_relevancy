import type { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  console.error("❌ ERROR:", err?.message || err);
  if (err?.stack) console.error(err.stack);

  // Zod errors (input or output)
  if (Array.isArray(err?.issues)) {
    return res.status(400).json({
      ok: false,
      requestId: (req as any).id,
      error: { code: "VALIDATION", message: "Invalid input/output", issues: err.issues }
    });
  }

  const status = Number(err?.statusCode || err?.status || 500);

  return res.status(status).json({
    ok: false,
    requestId: (req as any).id,
    error: { code: status === 500 ? "INTERNAL" : "BAD_REQUEST", message: err?.message || "Something went wrong" }
  });
}
