import { Router } from "express";
import { z } from "zod";
import { InteractionModel } from "../models/Interaction.js";
import { bumpInteractionEdges } from "../services/graph/bumpEdge.js";

const router = Router();

const BodySchema = z.object({
  campaignId: z.string().min(1),
  influencerId: z.string().min(1),
  actorType: z.enum(["brand", "influencer"]),
  action: z.enum(["view", "shortlist", "message", "hire", "reject"]),
  meta: z.record(z.string(), z.any()).optional()
});

function buildDeterministicKey(input: {
  campaignId: string;
  influencerId: string;
  actorType: "brand" | "influencer";
  action: "view" | "shortlist" | "message" | "hire" | "reject";
}) {
  // Deterministic per (action + campaign + influencer + actorType)
  // This is ideal for agent retries.
  return `${input.action}:${input.campaignId}:${input.influencerId}:${input.actorType}`;
}

router.post("/", async (req, res, next) => {
  try {
    const body = BodySchema.parse(req.body);

    const key = buildDeterministicKey(body);

    // 1) If already exists, return it (idempotent behavior)
    const existing = await InteractionModel.findOne({ idempotencyKey: key }).lean();
    if (existing) {
      return res.json({ ok: true, interactionId: String((existing as any)._id), idempotent: true });
    }

    // 2) Create interaction (first time only)
    const created = await InteractionModel.create({
      campaignId: body.campaignId,
      influencerId: body.influencerId,
      actorType: body.actorType,
      action: body.action,
      meta: body.meta ?? {},
      idempotencyKey: key
    });

    // 3) Update relevancy graph edge ONCE (only for first creation)
    await bumpInteractionEdges(body.campaignId, body.influencerId, body.action);

    return res.json({ ok: true, interactionId: String(created._id), idempotent: false });
  } catch (e) {
    next(e);
  }
});

export default router;
