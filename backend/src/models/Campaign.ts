import { Schema, model } from "mongoose";
import type { InferSchemaType } from "mongoose";

const CampaignSchema = new Schema(
  {
    title: { type: String, required: true },

    categories: { type: [String], default: [], index: true },
    requiredSkills: { type: [String], default: [] },

    deliverables: {
      reel: { type: Number, default: 1 },
      post: { type: Number, default: 0 },
      story: { type: Number, default: 0 }
    },

    budget: {
      currency: { type: String, default: "INR" },
      min: { type: Number, required: true },
      max: { type: Number, required: true }
    },

    constraints: {
      platform: { type: [String], default: ["instagram"], index: true },
      minStabilityOverall: { type: Number, default: 0 },
      maxAuthenticityRisk: { type: Number, default: 1 },
      maxTrendDependence: { type: Number, default: 100 }
    }
  },
  { timestamps: true }
);

CampaignSchema.index({ categories: 1 });
CampaignSchema.index({ "constraints.platform": 1 });


export type Campaign = InferSchemaType<typeof CampaignSchema>;
export const CampaignModel = model("Campaign", CampaignSchema);
