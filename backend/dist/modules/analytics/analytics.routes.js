import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireWorkspaceMember } from "../../middleware/auth.middleware.js";
import { getAnalyticsOverview, exportAnalyticsData } from "./analytics.service.js";
export const analyticsRouter = Router();
const overviewQuerySchema = z.object({
    range: z.enum(["7d", "30d", "90d", "12m", "all"]).optional().default("30d"),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});
const exportQuerySchema = z.object({
    format: z.enum(["json", "csv"]).optional().default("json"),
    range: z.enum(["7d", "30d", "90d", "12m", "all"]).optional().default("30d"),
});
// GET /api/v1/analytics/overview
analyticsRouter.get("/overview", requireAuth, requireWorkspaceMember(), async (req, res) => {
    const workspaceId = req.workspace.workspaceId;
    const query = overviewQuerySchema.parse(req.query);
    const overview = await getAnalyticsOverview(workspaceId, query.range, query.startDate, query.endDate);
    res.json({
        data: overview,
        meta: {
            timestamp: new Date().toISOString(),
        },
        error: null,
    });
});
// GET /api/v1/analytics/export
analyticsRouter.get("/export", requireAuth, requireWorkspaceMember(), async (req, res) => {
    const workspaceId = req.workspace.workspaceId;
    const query = exportQuerySchema.parse(req.query);
    const exported = await exportAnalyticsData(workspaceId, query.format, query.range);
    res.setHeader("Content-Type", exported.contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${exported.filename}"`);
    res.send(exported.data);
});
