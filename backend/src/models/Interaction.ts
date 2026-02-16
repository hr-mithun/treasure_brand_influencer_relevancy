import { Schema, model } from "mongoose";
import type { InferSchemaType } from "mongoose";

const InteractionSchema = new Schema(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true, index: true },
    influencerId: { type: Schema.Types.ObjectId, ref: "Influencer", required: true, index: true },

    actorType: { type: String, enum: ["brand", "influencer"], required: true },
    action: { type: String, enum: ["view", "shortlist", "message", "hire", "reject"], required: true, index: true },

    meta: { type: Object, default: {} },

    idempotencyKey: { type: String, default: null }
  },
  { timestamps: true }
);

InteractionSchema.index({ campaignId: 1, influencerId: 1, createdAt: -1 });
InteractionSchema.index({ idempotencyKey: 1, actorType: 1 }, { unique: true, sparse: true });

export type Interaction = InferSchemaType<typeof InteractionSchema>;
export const InteractionModel = model("Interaction", InteractionSchema);
