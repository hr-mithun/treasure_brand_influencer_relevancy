export type CriticIssue = {
  code: string;
  message: string;
};

export function runCritic(result: any): CriticIssue[] {
  const issues: CriticIssue[] = [];

  // Example checks (expand later)
  if (!result?.results || !Array.isArray(result.results)) {
    issues.push({
      code: "NO_RESULTS",
      message: "Agent returned no results"
    });
  }

  // Score sanity check
  for (const r of result?.results ?? []) {
    if (r.score < 0 || r.score > 100) {
      issues.push({
        code: "INVALID_SCORE",
        message: `Score out of range for influencer ${r.influencerId}`
      });
    }
  }

  return issues;
}
