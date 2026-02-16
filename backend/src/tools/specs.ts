import { z } from "zod";

type ToolSpec = {
  name: string;
  description: string;
  input: z.ZodTypeAny;
  output: z.ZodTypeAny;
};

// Legacy schema exports for docs/UI. Runtime tool registration is in registry.ts.
export const IngestInstagramTool: ToolSpec = {
  name: "ingest.instagram.refresh",
  description: "Fetch latest Instagram snapshot (mock/real source) and update influencer indexes.",
  input: z.object({ influencerId: z.string().min(1) }),
  output: z.object({
    ok: z.literal(true),
    influencerId: z.string(),
    snapshotId: z.string(),
    indexes: z.object({
      stability: z.number(),
      volatility: z.number(),
      trendDependence: z.number(),
      audienceMemory: z.number(),
      monetizationReadiness: z.number(),
    }),
  }),
};

export const RankInfluencersTool: ToolSpec = {
  name: "recommend.campaign_to_influencers",
  description: "Rank influencers for a campaign with explainable scoring (graph-boosted).",
  input: z.object({ campaignId: z.string().min(1) }),
  output: z.object({
    campaignId: z.string(),
    total: z.number(),
    results: z.array(
      z.object({
        influencerId: z.string(),
        score: z.number(),
        baseScore: z.number().optional(),
        graphBoost: z.number().optional(),
        edgeWeight: z.number().optional(),
        components: z.record(z.string(), z.any()),
        explanation: z.array(z.string()),
      })
    ),
  }),
};

export const RankCampaignsTool: ToolSpec = {
  name: "recommend.influencer_to_campaigns",
  description: "Rank campaigns for an influencer with explainable scoring.",
  input: z.object({ influencerId: z.string().min(1) }),
  output: z.object({
    influencerId: z.string(),
    total: z.number(),
    results: z.array(
      z.object({
        campaignId: z.string(),
        score: z.number(),
        components: z.record(z.string(), z.any()),
        explanation: z.array(z.string()),
      })
    ),
  }),
};

export const LogInteractionTool: ToolSpec = {
  name: "interactions.log",
  description: "Log brand/influencer interaction and update relevancy graph edge.",
  input: z.object({
    campaignId: z.string().min(1),
    influencerId: z.string().min(1),
    actorType: z.enum(["brand", "influencer"]),
    action: z.enum(["view", "shortlist", "message", "hire", "reject"]),
    meta: z.record(z.string(), z.any()).optional(),
  }),
  output: z.object({
    ok: z.literal(true),
    interactionId: z.string(),
    idempotent: z.boolean(),
  }),
};
