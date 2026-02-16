import type { Request, Response, NextFunction } from "express";

export function requestId(req: Request, res: Response, next: NextFunction) {
  // pino-http may already add req.id; keep consistent
  (req as any).id = (req as any).id ?? `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  res.setHeader("x-request-id", (req as any).id);
  next();
}
