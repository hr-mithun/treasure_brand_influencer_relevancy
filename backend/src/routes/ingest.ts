import { Router } from "express";
import { z } from "zod";
import { InfluencerModel } from "../models/Influencer.js";
import { IgSnapshotModel } from "../models/IgSnapshot.js";
import { MockInstagramSource } from "../services/instagram/mockSource.js";
import { computeIndexesFromSnapshot } from "../services/indexes/compute.js";

const router = Router();
const source = new MockInstagramSource();

router.post("/instagram/:influencerId/refresh", async (req, res, next) => {
  try {
    const { influencerId } = z.object({ influencerId: z.string().min(1) }).parse(req.params);

    const inf = await InfluencerModel.findById(influencerId);
    if (!inf) return res.status(404).json({ error: "Influencer not found" });
    if (!inf.instagram?.igUserId) return res.status(400).json({ error: "Influencer missing instagram.igUserId" });

    const payload = await source.fetchSnapshot(inf.instagram.igUserId);

    const snap = await IgSnapshotModel.create({
      influencerId: inf._id,
      source: payload.source,
      capturedAt: payload.capturedAt,
      profile: payload.profile,
      posts: payload.posts
    });

    const idx = computeIndexesFromSnapshot(snap as any);

    inf.stability.overall = idx.stability;
    inf.stability.volatility = idx.volatility;
    inf.stability.trendDependence = idx.trendDependence;
    inf.stability.audienceMemory = idx.audienceMemory;
    inf.stability.monetizationReadiness = idx.monetizationReadiness;

    inf.activity.lastPostAt = (payload.posts[0]?.timestamp as any) ?? null;
    inf.activity.postsLast30d = payload.posts.length;

    await inf.save();

    res.json({ ok: true, influencerId, snapshotId: snap._id, indexes: idx });
  } catch (e) {
    next(e);
  }
});

export default router;
