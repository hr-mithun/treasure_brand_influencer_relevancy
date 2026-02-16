import { Schema, model } from "mongoose";
import type { InferSchemaType } from "mongoose";

const InfluencerSchema = new Schema(
  {
    handle: { type: String, required: true, index: true },
    platform: { type: String, required: true, enum: ["instagram", "youtube"], index: true },

    categories: { type: [String], default: [], index: true },
    competence: { type: Map, of: Number, default: {} }, // 0..100

    stability: {
      overall: { type: Number, min: 0, max: 100, default: 0, index: true },
      volatility: { type: Number, min: 0, max: 100, default: 0 },
      trendDependence: { type: Number, min: 0, max: 100, default: 0 },
      audienceMemory: { type: Number, min: 0, max: 100, default: 0 },
      monetizationReadiness: { type: Number, min: 0, max: 100, default: 0 },
      authenticityRisk: { type: Number, min: 0, max: 1, default: 0 }
    },

    activity: {
      lastPostAt: { type: Date, default: null, index: true },
      postsLast30d: { type: Number, default: 0 }
    },

    pricing: {
      currency: { type: String, default: "INR" },
      reel: { type: Number, default: 0 },
      post: { type: Number, default: 0 },
      story: { type: Number, default: 0 }
    },

    instagram: {
      igUserId: { type: String, default: null, index: true },
      sourceMode: { type: String, enum: ["mock", "connected", "discovery"], default: "mock" }
    }
  },
  { timestamps: true }
);

export type Influencer = InferSchemaType<typeof InfluencerSchema>;
export const InfluencerModel = model("Influencer", InfluencerSchema);
