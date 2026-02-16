import { z } from "zod";
import { CampaignModel } from "../../models/Campaign.js";
import { InfluencerModel } from "../../models/Influencer.js";
import { scoreCampaignInfluencer, explain } from "../../services/matching/scoring.js";

export const recommendInfluencerToCampaignsTool = {
  name: "recommend.influencer_to_campaigns",
  description: "Rank campaigns for an influencer with explainable scoring.",
  inputSchema: z.object({
    influencerId: z.string().min(1)
  }),
  run: async ({ influencerId }: { influencerId: string }) => {
    const influencer = await InfluencerModel.findById(influencerId).lean();
    if (!influencer) throw new Error("Influencer not found");

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

    return { influencerId, total: ranked.length, results: ranked };
  }
};
