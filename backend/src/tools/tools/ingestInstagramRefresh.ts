import { z } from "zod";
import { InfluencerModel } from "../../models/Influencer.js";
import { IgSnapshotModel } from "../../models/IgSnapshot.js";
import { MockInstagramSource } from "../../services/instagram/mockSource.js";
import { computeIndexesFromSnapshot } from "../../services/indexes/compute.js";

export const ingestInstagramRefreshTool = {
  name: "ingest.instagram.refresh",
  description: "Fetch latest Instagram snapshot (mock/real source) and update influencer indexes.",
  inputSchema: z.object({
    influencerId: z.string().min(1)
  }),
  run: async ({ influencerId }: { influencerId: string }) => {
    const inf = await InfluencerModel.findById(influencerId);
    if (!inf) throw new Error("Influencer not found");
    if (!inf.instagram?.igUserId) throw new Error("Influencer missing instagram.igUserId");

    // MVP uses mock. Later: swap to ConnectedInstagramSource (OAuth).
    const source = new MockInstagramSource();
    const payload = await source.fetchSnapshot(inf.instagram.igUserId);

    const snap = await IgSnapshotModel.create({
      influencerId: inf._id,
      source: payload.source,
      capturedAt: payload.capturedAt,
      profile: payload.profile,
      posts: payload.posts
    });

    const idx = computeIndexesFromSnapshot(snap as any);

    inf.set("stability.overall", idx.stability);
    inf.set("stability.volatility", idx.volatility);
    inf.set("stability.trendDependence", idx.trendDependence);
    inf.set("stability.audienceMemory", idx.audienceMemory);
    inf.set("stability.monetizationReadiness", idx.monetizationReadiness);

    inf.set("activity.lastPostAt", payload.posts[0]?.timestamp ?? null);
    inf.set("activity.postsLast30d", payload.posts.length);

    await inf.save();

    return { ok: true as const, influencerId, snapshotId: String(snap._id), indexes: idx };
  }
};
