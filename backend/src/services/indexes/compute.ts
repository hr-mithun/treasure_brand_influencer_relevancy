import type { IgSnapshot } from "../../models/IgSnapshot.js";

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
const std = (xs: number[]) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
};

export function computeIndexesFromSnapshot(s: IgSnapshot) {
  const followers = Math.max(1, Number(s.profile?.followersCount ?? 1));
  const posts = s.posts ?? [];

  // engagement rate proxy per post
  const ers = posts.map((p: any) => ((p.likes ?? 0) + (p.comments ?? 0) + (p.saves ?? 0)) / followers);
  const v = std(ers);

  // normalize volatility: ER std 0.00..0.02 typical; tune later with real data
  const vol01 = clamp01(v / 0.02);
  const volatility = Math.round(vol01 * 100);
  const stability = Math.round((1 - vol01) * 100);

  // proxies (we'll upgrade later with real signals)
  const trendDependence = Math.round(vol01 * 100);

  const audienceMemory = Math.round((1 - vol01) * 100);

  // monetization readiness proxy: saves/views
  const ratios = posts.map((p: any) => (p.views ? (p.saves ?? 0) / Math.max(1, p.views) : 0));
  const mr01 = clamp01(mean(ratios) / 0.01); // ~1% saves/views => strong
  const monetizationReadiness = Math.round(mr01 * 100);

  return { stability, volatility, trendDependence, audienceMemory, monetizationReadiness };
}
