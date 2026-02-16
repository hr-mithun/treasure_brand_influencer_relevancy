import { Router } from "express";
import { AgentSessionModel } from "../models/AgentSession.js";

const router = Router();

router.get("/", async (_req, res) => {
  const sessions = await AgentSessionModel.find()
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  res.json({ sessions });
});

export default router;
