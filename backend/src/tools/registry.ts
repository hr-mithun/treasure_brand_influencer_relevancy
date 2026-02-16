import { z } from "zod";

// import your existing tool handlers
import { ingestInstagramRefreshTool } from "./tools/ingestInstagramRefresh.js";
import { recommendCampaignToInfluencersTool } from "./tools/recommendCampaignToInfluencers.js";
import { recommendInfluencerToCampaignsTool } from "./tools/recommendInfluencerToCampaigns.js";
import { interactionsLogTool } from "./tools/interactionsLog.js";

// Tool definition type
export type ToolDef = {
  name: string;
  description: string;
  inputSchema: z.ZodTypeAny;
  // outputSchema is useful for docs, not required at runtime
  run: (input: any) => Promise<any>;
};

// Single source of truth
export const TOOL_REGISTRY: ToolDef[] = [
  ingestInstagramRefreshTool,
  recommendCampaignToInfluencersTool,
  recommendInfluencerToCampaignsTool,
  interactionsLogTool,
];

export function listTools() {
  return TOOL_REGISTRY.map(t => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  }));
}

export async function runTool(name: string, input: any) {
  const tool = TOOL_REGISTRY.find(t => t.name === name);
  if (!tool) throw new Error(`Unknown tool: ${name}`);

  const parsed = tool.inputSchema.parse(input);
  return await tool.run(parsed);
}
