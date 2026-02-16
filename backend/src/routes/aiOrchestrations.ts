import { Router } from "express";
import { z } from "zod";
import { briefToCampaignDraft } from "../services/ai/briefToCampaignDraft.js";
import { CampaignModel } from "../models/Campaign.js";
import { recommendCampaignToInfluencers } from "../services/recommendations/campaignToInfluencers.js";

const router = Router();

router.post("/run/brief-to-ranked-influencers", async (req, res, next) => {
  try {
    const { brief } = z.object({ brief: z.string().min(10) }).parse(req.body);

    // 1) brief -> draft
    const draft = await briefToCampaignDraft(brief);

    // 2) draft -> campaign in DB
    const campaign = await CampaignModel.create({
      title: draft.title,
      categories: draft.categories,
      requiredSkills: draft.requiredSkills,
      deliverables: draft.deliverables,
      budget: draft.budget,
      constraints: draft.constraints
    });

    // 3) campaign -> ranking (same logic as /api/recommendations)
    const ranking = await recommendCampaignToInfluencers(campaign._id.toString());

    res.json({
      ok: true,
      campaignId: campaign._id.toString(),
      draft,
      ranking
    });
  } catch (e) {
    next(e);
  }
});

export default router;
