import { z } from "zod";
import crypto from "crypto";
import { InteractionModel } from "../../models/Interaction.js";
import { RelevancyEdgeModel } from "../../models/RelevancyEdge.js";

const InputSchema = z.object({
  campaignId: z.string().min(1),
  influencerId: z.string().min(1),
  actorType: z.enum(["brand", "influencer"]),
  action: z.enum(["view", "shortlist", "message", "hire", "reject"]),
  meta: z.record(z.string(), z.any()).optional(),
  idempotencyKey: z.string().min(1).optional()
});

function deterministicKey(input: z.infer<typeof InputSchema>) {
  // deterministic key per campaign+influencer+actorType+action
  const base = `${input.campaignId}:${input.influencerId}:${input.actorType}:${input.action}`;
  return crypto.createHash("sha256").update(base).digest("hex");
}

function actionWeight(action: string) {
  // tune later; stable for MVP
  switch (action) {
    case "view": return 0.02;
    case "shortlist": return 0.1;
    case "message": return 0.2;
    case "hire": return 0.5;
    case "reject": return -0.1;
    default: return 0;
  }
}

export const interactionsLogTool = {
  name: "interactions.log",
  description: "Log brand/influencer interaction and update relevancy graph edge.",
  inputSchema: InputSchema,
  run: async (input: z.infer<typeof InputSchema>) => {
    const key = input.idempotencyKey ?? deterministicKey(input);

    // idempotent insert: if already exists, return existing id
    const existing = await InteractionModel.findOne({ idempotencyKey: key }).lean();
    if (existing) {
      return { ok: true as const, interactionId: String((existing as any)._id) };
    }

    const doc = await InteractionModel.create({
      campaignId: input.campaignId,
      influencerId: input.influencerId,
      actorType: input.actorType,
      action: input.action,
      meta: input.meta ?? {},
      idempotencyKey: key
    });

    // Update edge weight (interaction reason)
    const delta = actionWeight(input.action);

    await RelevancyEdgeModel.findOneAndUpdate(
      {
        srcType: "campaign",
        srcId: input.campaignId,
        dstType: "influencer",
        dstId: input.influencerId,
        reason: "interaction"
      },
      {
        $setOnInsert: {
          srcType: "campaign",
          srcId: input.campaignId,
          dstType: "influencer",
          dstId: input.influencerId,
          reason: "interaction"
        },
        $inc: { weight: delta }
      },
      { upsert: true, new: true }
    );

    return { ok: true as const, interactionId: String(doc._id) };
  }
};
