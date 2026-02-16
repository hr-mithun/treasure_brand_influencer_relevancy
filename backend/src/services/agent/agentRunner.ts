import crypto from "crypto";
import { AgentSessionModel } from "../../models/AgentSession.js";
import { AgentGoalSchema, type AgentGoal } from "./planner.js";
import { planTools } from "./planner.js";
import { runTool } from "../../tools/registry.js";

export type AgentStep = {
  tool: string;
  input: any;
  output?: any;
  error?: any;
};

function hashRunKey(goal: AgentGoal) {
  return crypto.createHash("sha256").update(JSON.stringify(goal)).digest("hex");
}

export async function runAgent(goalInput: unknown) {
  const goal = AgentGoalSchema.parse(goalInput);
  const runKey = hashRunKey(goal);

  // idempotent: if same goal already completed, return it
  const existing = await AgentSessionModel.findOne({ runKey }).lean();
  if (existing?.status === "completed") return existing;

  // create or reset
  const session = await AgentSessionModel.findOneAndUpdate(
    { runKey },
    { goal, status: "running", plan: [], steps: [], final: null, error: null },
    { upsert: true, new: true }
  );

  try {
    const planned = await planTools(goal);

    session.set("plan", planned.plan);

    const steps: AgentStep[] = [];
    for (const s of planned.steps) {
      try {
        const output = await runTool(s.tool, s.input);
        steps.push({ tool: s.tool, input: s.input, output });
      } catch (e: any) {
        steps.push({ tool: s.tool, input: s.input, error: { message: e?.message || String(e) } });
        throw e;
      }
    }

    session.set("steps", steps);
    session.set("final", steps[steps.length - 1]?.output ?? null);
    session.set("status", "completed");

    await session.save();
    return session.toObject();
  } catch (e: any) {
    session.set("status", "failed");
    session.set("error", { message: e?.message || String(e) });
    await session.save();
    throw e;
  }
}
