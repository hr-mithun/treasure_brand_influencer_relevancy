import type { Request } from "express";

export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

export function getRequestId(req: Request) {
  return (req.headers["x-request-id"] as string) || "req_unknown";
}

export function ok<T>(req: Request, data: T) {
  return { ok: true as const, requestId: getRequestId(req), data };
}

export function fail(req: Request, error: ApiError) {
  return { ok: false as const, requestId: getRequestId(req), error };
}
