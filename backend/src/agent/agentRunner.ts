import type { AgentGoal, AgentResult, AgentStep } from "./types.js";
import { runCritic } from "./critic.js";
import { AgentSessionModel } from "../models/AgentSession.js";
import { agentRunKey } from "./utils.js";

export async function runAgent(goal: AgentGoal): Promise<AgentResult> {
  const runKey = agentRunKey(goal);

  // ---- IDEMPOTENCY CHECK ----
  const existing = await AgentSessionModel.findOne({ runKey });
  if (existing && existing.status === "completed") {
    return {
      plan: existing.plan,
      steps: existing.steps,
      final: existing.final
    };
  }

  // ---- CREATE SESSION ----
  const session = await AgentSessionModel.create({
    runKey,
    goal,
    plan: [],
    steps: [],
    final: null,
    status: "pending"
  });

  try {
    session.status = "running";

    const steps: AgentStep[] = [];
    const plan = [
      "Rank influencers for campaign",
      "Apply graph-based boost",
      "Validate results",
      "Return ranked list"
    ];

    const step1: AgentStep = {
      tool: "recommend.campaign_to_influencers",
      input: { campaignId: goal.campaignId }
    };
    steps.push(step1);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(
      `http://localhost:4000/api/recommendations/campaign/${goal.campaignId}/influencers`,
      { signal: controller.signal }
    ).then((r) => r.json());

    clearTimeout(timeout);
    step1.output = response;

    const issues = runCritic(response);
    if (issues.length) {
      throw new Error(issues[0].message);
    }

    session.plan = plan;
    session.steps = steps;
    session.final = response;
    session.status = "completed";
    await session.save();

    return { plan, steps, final: response };
  } catch (err: any) {
    session.status = "failed";
    session.error = { message: err.message };
    await session.save();
    throw err;
  }
}
