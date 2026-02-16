import { Schema, model } from "mongoose";
import type { InferSchemaType } from "mongoose";

const RelevancyEdgeSchema = new Schema(
  {
    srcType: { type: String, required: true, index: true }, // campaign|influencer|category
    srcId: { type: String, required: true, index: true },
    dstType: { type: String, required: true, index: true },
    dstId: { type: String, required: true, index: true },

    reason: { type: String, required: true }, // interaction|category_match
    weight: { type: Number, required: true, default: 0 },

    updatedAt: { type: Date, required: true, index: true }
  },
  { timestamps: false }
);

RelevancyEdgeSchema.index({ srcType: 1, srcId: 1, dstType: 1, dstId: 1, reason: 1 }, { unique: true });

export type RelevancyEdge = InferSchemaType<typeof RelevancyEdgeSchema>;
export const RelevancyEdgeModel = model("RelevancyEdge", RelevancyEdgeSchema);
