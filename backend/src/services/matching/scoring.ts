import type { Campaign } from "../../models/Campaign.js";
import type { Influencer } from "../../models/Influencer.js";

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

function jaccard(a: string[], b: string[]) {
  const A = new Set(a);
  const B = new Set(b);
  const inter = [...A].filter((x) => B.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : inter / union;
}

// Works for BOTH:
// - Mongoose Map (non-lean docs): competence.get("reels")
// - plain object (lean): competence["reels"]
function readCompetence(i: any, key: string): number {
  if (i?.competence && typeof i.competence.get === "function") {
    return Number(i.competence.get(key) ?? 0);
  }
  if (i?.competence && typeof i.competence === "object") {
    return Number(i.competence[key] ?? 0);
  }
  return 0;
}

export function scoreCampaignInfluencer(c: Campaign, i: Influencer) {
  const catFit = clamp01(jaccard(c.categories ?? [], i.categories ?? []));

  const reqSkills = c.requiredSkills ?? [];
  let compFit = 0.6;

  if (reqSkills.length) {
    const vals = reqSkills.map((s) => clamp01(readCompetence(i as any, s) / 100));
    compFit = vals.reduce((a, b) => a + b, 0) / vals.length;
  }

  const stability = clamp01(Number((i as any).stability?.overall ?? 0) / 100);
  const audienceMemory = clamp01(Number((i as any).stability?.audienceMemory ?? 0) / 100);
  const monetization = clamp01(Number((i as any).stability?.monetizationReadiness ?? 0) / 100);

  const needReel = (c.deliverables?.reel ?? 0) > 0;
  const price = needReel ? Number((i as any).pricing?.reel ?? 0) : Number((i as any).pricing?.post ?? 0);

  const budgetMin = Number(c.budget?.min ?? 0);
  const budgetMax = Number(c.budget?.max ?? 0);

  const budgetFit = price > 0 && price >= budgetMin && price <= budgetMax ? 1 : 0;

  // MVP weights (tune later)
  const score01 =
    0.30 * catFit +
    0.25 * compFit +
    0.20 * stability +
    0.15 * audienceMemory +
    0.10 * monetization;

  // penalty if budgetFit false (still allow ranking)
  const score = 100 * score01 - (budgetFit ? 0 : 12);

  return {
    score: Math.round(score * 10) / 10,
    components: { catFit, compFit, stability, audienceMemory, monetization, budgetFit }
  };
}

export function explain(c: Campaign, i: Influencer, comps: any) {
  const shared = (c.categories ?? []).filter((x) => (i.categories ?? []).includes(x));
  const out: string[] = [];

  if (shared.length) out.push(`Category overlap: ${shared.join(", ")}`);
  if ((c.requiredSkills ?? []).length) out.push(`Competence fit: ${(comps.compFit * 100).toFixed(0)}%`);
  out.push(`Stability: ${(comps.stability * 100).toFixed(0)}%`);
  out.push(`Audience memory: ${(comps.audienceMemory * 100).toFixed(0)}%`);
  out.push(`Monetization readiness: ${(comps.monetization * 100).toFixed(0)}%`);
  out.push(`Budget fit: ${comps.budgetFit ? "Yes" : "No"}`);

  return out;
}
