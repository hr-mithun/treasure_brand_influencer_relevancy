export type AgentGoal =
  | {
      type: "rank_influencers_for_campaign";
      campaignId: string;
    };

export type AgentStep = {
  tool: string;
  input: any;
  output?: any;
};

export type AgentResult = {
  plan: string[];
  steps: AgentStep[];
  final: any;
};
