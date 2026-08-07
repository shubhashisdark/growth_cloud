import cors from "cors";
import express, { type Request, type Response } from "express";
import http from "node:http";
import { ZodError } from "zod";

import { getConfig } from "./config/env.js";
import { aiRouter } from "./modules/ai/ai.routes.js";
import { analyticsRouter } from "./modules/analytics/analytics.routes.js";
import { apiKeysRouter } from "./modules/api-keys/api-keys.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { emailRouter, trackingAliasRouter } from "./modules/email/email.routes.js";
import { leadsRouter } from "./modules/leads/leads.routes.js";
import { segmentsRouter } from "./modules/segments/segments.routes.js";
import { scoringRouter } from "./modules/scoring/scoring.routes.js";
import { workflowsRouter } from "./modules/workflows/workflows.routes.js";
import { workspacesRouter } from "./modules/workspaces/workspaces.routes.js";
import { webhooksRouter } from "./modules/webhooks/webhooks.routes.js";
import { sdkRouter } from "./modules/sdk/sdk.routes.js";

export function createApp() {
  const config = getConfig();
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.text({ type: ["text/plain", "text/csv"], limit: "2mb" }));

  app.get("/health", (_request: Request, response: Response) => {
    response.json({
      data: {
        status: "ok",
        service: "growth-cloud-backend",
        version: "1.0.0"
      },
      meta: {
        timestamp: new Date().toISOString()
      },
      error: null
    });
  });

  app.get("/api/v1", (_request: Request, response: Response) => {
    response.json({
      data: {
        name: "Growth Cloud Backend API",
        modules: ["auth", "workspaces", "api-keys", "leads", "email", "segments", "workflows", "scoring", "webhooks", "sdk", "analytics", "ai"]
      },
      meta: {
        timestamp: new Date().toISOString()
      },
      error: null
    });
  });

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/workspaces", workspacesRouter);
  app.use("/api/v1/api-keys", apiKeysRouter);
  app.use("/api/v1/leads", leadsRouter);
  app.use("/api/v1/email", emailRouter);
  app.use("/api/v1/tracking", trackingAliasRouter);
  app.use("/api/v1/segments", segmentsRouter);
  app.use("/api/v1/scoring", scoringRouter);
  app.use("/api/v1/workflows", workflowsRouter);
  app.use("/api/v1/webhooks", webhooksRouter);
  app.use("/api/v1/sdk", sdkRouter);
  app.use("/api/v1/analytics", analyticsRouter);
  app.use("/api/v1/ai", aiRouter);

  app.use((error: unknown, _request: Request, response: Response, _next: express.NextFunction) => {
    if (error instanceof ZodError) {
      return response.status(400).json({
        data: null,
        meta: {
          timestamp: new Date().toISOString()
        },
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: error.flatten()
        }
      });
    }

    return response.status(500).json({
      data: null,
      meta: {
        timestamp: new Date().toISOString()
      },
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown server error"
      }
    });
  });

  // Attach a `fetch(Request)` helper so tests can call `createApp().fetch(...)`.
  (app as any).fetch = async (request: globalThis.Request) => {
    const server = http.createServer(app as any);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    const port = typeof address === "object" && address ? (address.port as number) : 0;

    try {
      const url = new URL(request.url);
      url.hostname = "127.0.0.1";
      url.port = String(port);

      const init: RequestInit = {
        method: request.method,
        headers: Object.fromEntries(request.headers as any)
      };

      if (request.method !== "GET" && request.method !== "HEAD") {
        const body = await request.text();
        if (body) {
          init.body = body;
        }
      }

      const response = await globalThis.fetch(url.toString(), init);
      return response;
    } finally {
      server.close();
    }
  };

  return app;
}
