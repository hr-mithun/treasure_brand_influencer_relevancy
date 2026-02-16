import dotenv from "dotenv";
dotenv.config();

import { connectDb } from "../config/db.js";
import { InfluencerModel } from "../models/Influencer.js";
import { CampaignModel } from "../models/Campaign.js";

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI missing");
  }

  await connectDb(process.env.MONGODB_URI);

  // Clean slate (dev / demo only)
  await InfluencerModel.deleteMany({});
  await CampaignModel.deleteMany({});

  // -----------------------------
  // Seed Influencer
  // -----------------------------
  const influencer = await InfluencerModel.create({
    handle: "demo_creator_1",
    platform: "instagram",

    categories: ["fitness", "nutrition"],

    competence: new Map([
      ["reels", 85],
      ["ugc", 75]
    ]),

    stability: {
      overall: 0,
      volatility: 0,
      trendDependence: 0,
      audienceMemory: 0,
      monetizationReadiness: 0,
      authenticityRisk: 0
    },

    activity: {
      lastPostAt: null,
      postsLast30d: 0
    },

    pricing: {
      currency: "INR",
      reel: 18000,
      post: 12000,
      story: 5000
    },

    instagram: {
      igUserId: "123",
      sourceMode: "mock"
    }
  });

  console.log("✅ Seeded influencer:", influencer._id.toString());

  // -----------------------------
  // Seed Campaign
  // -----------------------------
  const campaign = await CampaignModel.create({
    title: "Protein Launch – Reels Campaign",

    categories: ["fitness", "nutrition"],
    requiredSkills: ["reels", "ugc"],

    deliverables: {
      reel: 1,
      post: 0,
      story: 2
    },

    budget: {
      currency: "INR",
      min: 10000,
      max: 25000
    },

    constraints: {
      platform: ["instagram"],
      minStabilityOverall: 0,
      maxAuthenticityRisk: 1,
      maxTrendDependence: 100
    }
  });

  console.log("✅ Seeded campaign:", campaign._id.toString());

  console.log("🎉 Seeding complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
