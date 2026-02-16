import { z } from "zod";
import { recommendCampaignToInfluencers } from "../../services/recommendations/campaignToInfluencers.js";

export const recommendCampaignToInfluencersTool = {
  name: "recommend.campaign_to_influencers",
  description: "Rank influencers for a campaign with explainable scoring (graph-boosted).",
  inputSchema: z.object({
    campaignId: z.string().min(1)
  }),
  run: async ({ campaignId }: { campaignId: string }) => {
    return await recommendCampaignToInfluencers(campaignId);
  }
};
