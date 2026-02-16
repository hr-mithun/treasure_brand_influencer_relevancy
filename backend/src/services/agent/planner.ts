import { groqChatJson } from "../llm/groqClient.js";
import { z } from "zod";
import { listTools } from "../../tools/registry.js";

export const AgentGoalSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("rank_influencers_for_campaign"), campaignId: z.string().min(1) }),
  z.object({ type: z.literal("refresh_influencer_instagram"), influencerId: z.string().min(1) }),
  z.object({ type: z.literal("log_interaction"), campaignId: z.string().min(1), influencerId: z.string().min(1), actorType: z.enum(["brand","influencer"]), action: z.enum(["view","shortlist","message","hire","reject"]) }),
]);

export type AgentGoal = z.infer<typeof AgentGoalSchema>;

const PlanSchema = z.object({
  plan: z.array(z.string()).min(1),
  steps: z.array(z.object({
    tool: z.string().min(1),
    input: z.record(z.string(), z.any()),
  })).min(1)
});

export type AgentPlan = z.infer<typeof PlanSchema>;

export async function planTools(goal: AgentGoal): Promise<AgentPlan> {
  const tools = listTools();

  const system = `
You are a tool-using planner.
Given a GOAL and a list of TOOLS, output a JSON plan with:
- plan: array of short strings
- steps: array of { tool, input }

Rules:
- Use only tools from the tool list.
- Inputs MUST match each tool's inputSchema.
- Return ONLY valid JSON (no markdown).
`.trim();

  const user = `
GOAL:
${JSON.stringify(goal)}

TOOLS:
${JSON.stringify(tools, null, 2)}

Return JSON:
{ "plan": [...], "steps": [ { "tool": "...", "input": {...} } ] }
`.trim();

  const raw = await groqChatJson({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    temperature: 0
  });

  return PlanSchema.parse(raw);
}
