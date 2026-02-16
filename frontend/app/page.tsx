"use client";

import { useState } from "react";

const DEFAULT_BRIEF =
  "We are launching a protein snack brand in India. Need fitness creators on Instagram. Prefer reels + 2 stories. Budget 10k-25k INR. Must have stable engagement, not trend-only creators. Niche: fitness, nutrition.";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000").replace(/\/+$/, "");

type ApiError = {
  message?: string;
};

type Draft = Record<string, unknown>;

type RankingItem = {
  influencerId: string;
  score: number;
  explanation?: string[];
};

type RankingResponse = {
  results?: RankingItem[];
} & Record<string, unknown>;

type ParseBriefResponse = {
  ok?: boolean;
  draft?: Draft;
  error?: ApiError;
};

type RunEndToEndResponse = {
  ok?: boolean;
  campaignId?: string;
  draft?: Draft;
  ranking?: RankingResponse;
  error?: ApiError;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

async function postJson<T extends { ok?: boolean; error?: ApiError }>(
  path: string,
  payload: unknown
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const raw = await response.text();
  let json = {} as T;

  if (raw) {
    try {
      json = JSON.parse(raw) as T;
    } catch {
      throw new Error(`Invalid JSON response (${response.status})`);
    }
  }

  if (!response.ok || json.ok === false) {
    throw new Error(json.error?.message || `Request failed (${response.status})`);
  }

  return json;
}

export default function HomePage() {
  const [brief, setBrief] = useState(DEFAULT_BRIEF);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [ranking, setRanking] = useState<RankingResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function parseBrief() {
    setErr(null);
    setCampaignId(null);
    setRanking(null);
    setLoading(true);

    try {
      const response = await postJson<ParseBriefResponse>("/api/ai/brief/parse", { brief });
      if (!response.draft) throw new Error("Parse failed: missing draft payload");
      setDraft(response.draft);
    } catch (error: unknown) {
      setErr(getErrorMessage(error, "Parse failed"));
    } finally {
      setLoading(false);
    }
  }

  async function runEndToEnd() {
    setErr(null);
    setCampaignId(null);
    setRanking(null);
    setLoading(true);

    try {
      const response = await postJson<RunEndToEndResponse>("/api/run/brief-to-ranked-influencers", { brief });

      if (!response.campaignId || !response.draft || !response.ranking) {
        throw new Error("Run failed: missing required response fields");
      }

      setCampaignId(response.campaignId);
      setDraft(response.draft);
      setRanking(response.ranking);
    } catch (error: unknown) {
      setErr(getErrorMessage(error, "Run failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 980, margin: "30px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Treasure MVP - Brief -&gt; Campaign -&gt; Ranked Influencers</h1>

      <div style={{ marginTop: 16 }}>
        <label style={{ fontWeight: 600 }}>Brand brief</label>
        <textarea
          value={brief}
          onChange={(event) => setBrief(event.target.value)}
          rows={6}
          style={{ width: "100%", marginTop: 8, padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
        />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button onClick={parseBrief} disabled={loading} style={{ padding: "10px 14px", borderRadius: 10 }}>
          Parse brief (draft)
        </button>
        <button onClick={runEndToEnd} disabled={loading} style={{ padding: "10px 14px", borderRadius: 10 }}>
          Run end-to-end (create + rank)
        </button>
      </div>

      {err && <p style={{ color: "crimson", marginTop: 10 }}>Error: {err}</p>}

      {draft && (
        <section style={{ marginTop: 18 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Draft</h2>
          <pre style={{ background: "#f7f7f7", padding: 12, borderRadius: 10, overflowX: "auto" }}>
            {JSON.stringify(draft, null, 2)}
          </pre>
        </section>
      )}

      {campaignId && (
        <p style={{ marginTop: 12 }}>
          <b>Campaign created:</b> {campaignId}
        </p>
      )}

      {ranking && (
        <section style={{ marginTop: 18 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Ranked influencers</h2>
          {ranking.results?.map((result) => (
            <div
              key={result.influencerId}
              style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 12, marginTop: 10 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <b>{result.influencerId}</b>
                <b>Score: {result.score}</b>
              </div>
              <div style={{ marginTop: 8, fontSize: 13, color: "#333" }}>
                {Array.isArray(result.explanation) ? (
                  <ul>
                    {result.explanation.map((text, index) => (
                      <li key={`${result.influencerId}-${index}`}>{text}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
