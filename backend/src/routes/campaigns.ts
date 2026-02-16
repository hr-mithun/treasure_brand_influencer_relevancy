import { Router } from "express";
import { z } from "zod";
import { CampaignModel } from "../models/Campaign.js";
import { CampaignDraftSchema } from "../services/ai/briefToCampaignDraft.js";

const router = Router();

// POST /api/campaigns/from-draft
router.post("/from-draft", async (req, res, next) => {
  try {
    const BodySchema = z.object({
      draft: CampaignDraftSchema
    });

    const { draft } = BodySchema.parse(req.body);

    const campaign = await CampaignModel.create({
      title: draft.title,
      categories: draft.categories,
      requiredSkills: draft.requiredSkills,
      deliverables: draft.deliverables,
      budget: draft.budget,
      constraints: draft.constraints
      // notes are not stored in Campaign in our MVP (optional: add later)
    });

    res.json({ ok: true, campaignId: campaign._id.toString() });
  } catch (e) {
    next(e);
  }
});

export default router;
