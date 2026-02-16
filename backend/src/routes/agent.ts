import { Router } from "express";
import { z } from "zod";
import { AgentSessionModel } from "../models/AgentSession.js";
import { runAgent } from "../services/agent/agentRunner.js";

const router = Router();

router.get("/agent/sessions", async (req, res, next) => {
  try {
    const sessions = await AgentSessionModel.find({}).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ sessions });
  } catch (e) {
    next(e);
  }
});

router.post("/agent/run", async (req, res, next) => {
  try {
    const { goal } = z.object({ goal: z.any() }).parse(req.body);
    const result = await runAgent(goal);
    res.json({ ok: true, result });
  } catch (e) {
    next(e);
  }
});

export default router;
