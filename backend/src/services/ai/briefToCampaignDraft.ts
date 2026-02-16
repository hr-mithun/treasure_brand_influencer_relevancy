import { z } from "zod";
import { groqChatJson } from "../llm/groqClient.js";

export const CampaignDraftSchema = z.object({
  title: z.string().min(1),
  categories: z.array(z.string().min(1)).min(1),
  requiredSkills: z.array(z.string().min(1)).default([]),

  deliverables: z.object({
    reel: z.number().int().nonnegative().default(0),
    post: z.number().int().nonnegative().default(0),
    story: z.number().int().nonnegative().default(0)
  }),

  budget: z.object({
    currency: z.string().default("INR"),
    min: z.number().nonnegative().default(0),
    max: z.number().nonnegative().default(0)
  }),

  constraints: z.object({
    platform: z.array(z.enum(["instagram", "youtube"])).default(["instagram"]),
    minStabilityOverall: z.number().min(0).max(100).default(0),
    maxTrendDependence: z.number().min(0).max(100).default(100),
    maxAuthenticityRisk: z.number().min(0).max(100).default(100)
  }),

  // we still keep this as array; we will enforce non-empty after parse
  notes: z.array(z.string()).default([])
});

export type CampaignDraft = z.infer<typeof CampaignDraftSchema>;

const JSON_TEMPLATE = `{
  "title": "",
  "categories": [],
  "requiredSkills": [],
  "deliverables": { "reel": 0, "post": 0, "story": 0 },
  "budget": { "currency": "INR", "min": 0, "max": 0 },
  "constraints": {
    "platform": ["instagram"],
    "minStabilityOverall": 0,
    "maxTrendDependence": 100,
    "maxAuthenticityRisk": 100
  },
  "notes": []
}`;

function postProcessDraft(d: CampaignDraft): CampaignDraft {
  // 1) Ensure requiredSkills aligns with deliverables (deterministic)
  const skills = new Set(d.requiredSkills ?? []);
  if (d.deliverables.reel > 0) skills.add("reels");
  if (d.deliverables.post > 0) skills.add("post");
  if (d.deliverables.story > 0) skills.add("story");
  d.requiredSkills = Array.from(skills);

  // 2) Ensure notes are NEVER empty (deterministic)
  const notes: string[] = Array.isArray(d.notes) ? [...d.notes] : [];

  // summarize deliverables + budget + constraints into notes
  notes.push(`Deliverables: ${d.deliverables.reel} reel(s), ${d.deliverables.post} post(s), ${d.deliverables.story} story(ies).`);
  notes.push(`Budget: ${d.budget.currency} ${d.budget.min}–${d.budget.max}.`);
  if (d.constraints.minStabilityOverall > 0) notes.push(`Prefer stable engagement (minStabilityOverall ≥ ${d.constraints.minStabilityOverall}).`);
  if (d.constraints.maxTrendDependence < 100) notes.push(`Avoid trend-only creators (maxTrendDependence ≤ ${d.constraints.maxTrendDependence}).`);
  if (d.constraints.maxAuthenticityRisk < 100) notes.push(`Low authenticity risk preferred (maxAuthenticityRisk ≤ ${d.constraints.maxAuthenticityRisk}).`);

  // also add a category summary (useful for UI)
  if (d.categories?.length) notes.push(`Target categories: ${d.categories.join(", ")}.`);

  // Deduplicate while preserving order
  const seen = new Set<string>();
  d.notes = notes
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .filter((s) => (seen.has(s) ? false : (seen.add(s), true)));

  return d;
}

export async function briefToCampaignDraft(brief: string): Promise<CampaignDraft> {
  const system = `
You convert a brand brief into a JSON object that matches EXACTLY this template.

Rules:
- Return ONLY JSON (no markdown, no comments, no extra keys).
- Keep the same keys and nested structure as the template.
- Fill missing info with sensible defaults.
- deliverables.reel/post/story MUST be integers.
- categories MUST be a non-empty array of strings.
- title MUST be a non-empty string.
- constraints.platform can only include "instagram" and/or "youtube".
- IMPORTANT: notes MUST contain 2 to 5 short strings summarizing preferences/constraints from the brief.
Output must be valid JSON.

Template:
${JSON_TEMPLATE}
`.trim();

  const raw = await groqChatJson({
    messages: [
      { role: "system", content: system },
      { role: "user", content: brief.trim() }
    ],
    temperature: 0
  });

  const parsed = CampaignDraftSchema.safeParse(raw);
  if (parsed.success) return postProcessDraft(parsed.data);

  // One repair attempt
  const repairSystem = `
Fix the JSON to match the template EXACTLY.
Return ONLY valid JSON.
No extra keys.
Remember: notes must be 2 to 5 short strings.
`.trim();

  const repairUser = `
Template:
${JSON_TEMPLATE}

The JSON you produced:
${JSON.stringify(raw)}

Validation errors:
${JSON.stringify(parsed.error.issues)}

Return corrected JSON only.
`.trim();

  const repaired = await groqChatJson({
    messages: [
      { role: "system", content: repairSystem },
      { role: "user", content: repairUser }
    ],
    temperature: 0
  });

  const finalDraft = CampaignDraftSchema.parse(repaired);
  return postProcessDraft(finalDraft);
}
