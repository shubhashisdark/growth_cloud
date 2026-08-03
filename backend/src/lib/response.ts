import type { Response } from "express";

export interface ApiResponse<T> {
  data: T | null;
  meta: {
    timestamp: string;
    [key: string]: unknown;
  };
  error: {
    code: string;
    message: string;
    details?: unknown;
  } | null;
}

export function sendSuccess<T>(response: Response, data: T, meta: Record<string, unknown> = {}) {
  return response.json({
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
    error: null,
  });
}

export function sendError(response: Response, code: string, message: string, status = 400, details?: unknown) {
  return response.status(status).json({
    data: null,
    meta: {
      timestamp: new Date().toISOString(),
    },
    error: {
      code,
      message,
      details,
    },
  });
}
