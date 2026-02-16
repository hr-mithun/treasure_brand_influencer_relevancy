import { CampaignModel } from "../../models/Campaign.js";
import { InfluencerModel } from "../../models/Influencer.js";
import { RelevancyEdgeModel } from "../../models/RelevancyEdge.js";
import { scoreCampaignInfluencer, explain } from "../matching/scoring.js";

async function getInteractionEdgeWeights(campaignId: string, influencerIds: string[]) {
  const edges = await RelevancyEdgeModel.find({
    srcType: "campaign",
    srcId: campaignId,
    dstType: "influencer",
    dstId: { $in: influencerIds },
    reason: "interaction"
  }).lean();

  const map = new Map<string, number>();
  for (const e of edges) map.set(String((e as any).dstId), Number((e as any).weight ?? 0));
  return map;
}

export async function recommendCampaignToInfluencers(campaignId: string) {
  const campaign = await CampaignModel.findById(campaignId).lean();
  if (!campaign) {
    const err: any = new Error("Campaign not found");
    err.statusCode = 404;
    throw err;
  }

  const constraints = (campaign as any).constraints ?? {
    platform: ["instagram"],
    minStabilityOverall: 0,
    maxAuthenticityRisk: 1,
    maxTrendDependence: 100
  };

  const candidates = await InfluencerModel.find({
    platform: { $in: constraints.platform },
    ...(((campaign as any).categories?.length ? { categories: { $in: (campaign as any).categories } } : {}) as any)
  }).lean();

  const influencerIds = candidates.map((x) => String((x as any)._id));
  const edgeWeights = await getInteractionEdgeWeights(campaignId, influencerIds);

  const ranked = candidates
    .map((inf) => {
      const base = scoreCampaignInfluencer(campaign as any, inf as any);

      const influencerId = String((inf as any)._id);
      const edgeWeight = edgeWeights.get(influencerId) ?? 0;

      // Simple boost: each 0.1 weight -> +2 score points (tune later)
      const graphBoost = Math.max(-10, Math.min(10, edgeWeight * 20));

      const finalScore = Math.round((base.score + graphBoost) * 10) / 10;

      return {
        influencerId,
        score: finalScore,
        baseScore: base.score,
        graphBoost,
        edgeWeight,
        components: base.components,
        explanation: [
          ...explain(campaign as any, inf as any, base.components),
          `Graph boost: ${graphBoost.toFixed(1)} (edgeWeight=${edgeWeight.toFixed(2)})`
        ]
      };
    })
    .sort((a, b) => b.score - a.score);

  return { campaignId, total: ranked.length, results: ranked };
}
