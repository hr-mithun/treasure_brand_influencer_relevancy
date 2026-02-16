import fs from "fs";
import path from "path";
import type { InstagramDataSource, IgSnapshotPayload } from "./types.js";

export class MockInstagramSource implements InstagramDataSource {
  async fetchSnapshot(igUserId: string): Promise<IgSnapshotPayload> {
    const file = path.join(process.cwd(), "fixtures", `ig_${igUserId}.json`);
    const raw = fs.readFileSync(file, "utf-8");
    const j = JSON.parse(raw);

    return {
      source: "mock",
      capturedAt: new Date(),
      profile: j.profile,
      posts: (j.posts ?? []).map((p: any) => ({
        id: p.id,
        timestamp: new Date(p.timestamp),
        likes: Number(p.likes ?? 0),
        comments: Number(p.comments ?? 0),
        saves: Number(p.saves ?? 0),
        views: Number(p.views ?? 0)
      }))
    };
  }
}
