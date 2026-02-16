import { Router } from "express";
import { z } from "zod";
import { RelevancyEdgeModel } from "../models/RelevancyEdge.js";

const router = Router();

router.get("/edges", async (req, res, next) => {
  try {
    const q = z.object({
      srcType: z.string().optional(),
      srcId: z.string().optional(),
      reason: z.string().optional(),
      limit: z.coerce.number().optional().default(200)
    }).parse(req.query);

    const filter: any = {};
    if (q.srcType) filter.srcType = q.srcType;
    if (q.srcId) filter.srcId = q.srcId;
    if (q.reason) filter.reason = q.reason;

    const edges = await RelevancyEdgeModel.find(filter)
      .sort({ updatedAt: -1 })
      .limit(Math.min(q.limit, 500))
      .lean();

    res.json({ edges });
  } catch (e) {
    next(e);
  }
});

export default router;
