import { Schema, model } from "mongoose";
import type { InferSchemaType } from "mongoose";

const AgentSessionSchema = new Schema(
  {
    goal: { type: Object, required: true },
    plan: { type: [String], required: true, default: [] },
    steps: { type: [Object], required: true, default: [] },

    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed"],
      required: true,
      default: "pending"
    },

    // final/error should be nullable until completion/failure
    final: { type: Object, default: null },
    error: { type: Object, default: null },

    runKey: { type: String, required: true, unique: true }
  },
  { timestamps: true }
);

export type AgentSession = InferSchemaType<typeof AgentSessionSchema>;
export const AgentSessionModel = model("AgentSession", AgentSessionSchema);
