import { Router } from "express";
import { z } from "zod";
import { CampaignModel } from "../models/Campaign.js";
import { InfluencerModel } from "../models/Influencer.js";
import { RelevancyEdgeModel } from "../models/RelevancyEdge.js";
import { scoreCampaignInfluencer, explain } from "../services/matching/scoring.js";
import { recommendCampaignToInfluencers } from "../services/recommendations/campaignToInfluencers.js";


const router = Router();

async function getInteractionEdgeWeights(campaignId: string, influencerIds: string[]) {
  const edges = await RelevancyEdgeModel.find({
    srcType: "campaign",
    srcId: campaignId,
    dstType: "influencer",
    dstId: { $in: influencerIds },
    reason: "interaction"
  }).lean();

  const map = new Map<string, number>();
  for (const e of edges) map.set(e.dstId, Number(e.weight ?? 0));
  return map;
}

/**
 * Campaign -> Influencers ranking (graph boosted)
 * GET /api/recommendations/campaign/:campaignId/influencers
 */
router.get("/campaign/:campaignId/influencers", async (req, res, next) => {
  try {
    const { campaignId } = z.object({ campaignId: z.string().min(1) }).parse(req.params);

    const result = await recommendCampaignToInfluencers(campaignId);
    res.json(result);
  } catch (e: any) {
    // preserve 404 behavior
    if (e?.statusCode === 404) return res.status(404).json({ error: "Campaign not found" });
    next(e);
  }
});

/**
 * Influencer -> Campaigns ranking (no graph boost yet)
 * GET /api/recommendations/influencer/:influencerId/campaigns
 */
router.get("/influencer/:influencerId/campaigns", async (req, res, next) => {
  try {
    const { influencerId } = z.object({ influencerId: z.string().min(1) }).parse(req.params);

    const influencer = await InfluencerModel.findById(influencerId).lean();
    if (!influencer) return res.status(404).json({ error: "Influencer not found" });

    const campaigns = await CampaignModel.find({
      ...(influencer.categories?.length ? { categories: { $in: influencer.categories } } : {})
    }).lean();

    const ranked = campaigns
      .map((c) => {
        const scored = scoreCampaignInfluencer(c as any, influencer as any);
        return {
          campaignId: String((c as any)._id),
          score: scored.score,
          components: scored.components,
          explanation: explain(c as any, influencer as any, scored.components)
        };
      })
      .sort((a, b) => b.score - a.score);

    res.json({ influencerId, total: ranked.length, results: ranked });
  } catch (e) {
    next(e);
  }
});

export default router;
