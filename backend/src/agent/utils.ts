import crypto from "crypto";

export function agentRunKey(goal: any) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(goal))
    .digest("hex");
}
