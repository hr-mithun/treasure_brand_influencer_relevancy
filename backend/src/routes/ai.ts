// src/routes/ai.ts
import { Router } from "express";
import { z } from "zod";
import { briefToCampaignDraft } from "../services/ai/briefToCampaignDraft.js";

const router = Router();

router.post("/brief/parse", async (req, res, next) => {
  try {
    const { brief } = z.object({ brief: z.string().min(10) }).parse(req.body);
    const draft = await briefToCampaignDraft(brief);
    res.json({ ok: true, draft });
  } catch (e) {
    next(e);
  }
});

export default router;
