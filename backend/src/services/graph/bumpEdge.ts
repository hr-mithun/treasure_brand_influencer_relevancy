import { RelevancyEdgeModel } from "../../models/RelevancyEdge.js";

export async function bumpInteractionEdges(campaignId: string, influencerId: string, action: string) {
  const now = new Date();

  const delta =
    action === "hire" ? 0.25 :
    action === "shortlist" ? 0.10 :
    action === "message" ? 0.06 :
    action === "view" ? 0.02 :
    action === "reject" ? -0.05 :
    0;

  // Campaign -> Influencer edge
  await RelevancyEdgeModel.updateOne(
    { srcType: "campaign", srcId: campaignId, dstType: "influencer", dstId: influencerId, reason: "interaction" },
    { $set: { updatedAt: now }, $inc: { weight: delta } },
    { upsert: true }
  );
}
