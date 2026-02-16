type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

function extractJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("No JSON object found in LLM output");
  return JSON.parse(text.slice(start, end + 1));
}

async function fetchWithTimeout(url: string, init: RequestInit, ms: number) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export async function groqChatJson(params: {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  retries?: number;
}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing GROQ_API_KEY");

  const model = params.model ?? process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
  const url = "https://api.groq.com/openai/v1/chat/completions";

  const body = {
    model,
    messages: params.messages,
    temperature: params.temperature ?? 0,
    max_tokens: params.maxTokens ?? 900,
  };

  const timeoutMs = params.timeoutMs ?? 15_000;
  const retries = params.retries ?? 2;

  let lastErr: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resp = await fetchWithTimeout(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      }, timeoutMs);

      const rawText = await resp.text();

      if (!resp.ok) {
        throw new Error(`Groq error ${resp.status}: ${rawText}`);
      }

      const data = JSON.parse(rawText) as any;
      const content: string | undefined = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error("Groq returned empty content");

      try {
        return JSON.parse(content);
      } catch {
        return extractJsonObject(content);
      }
    } catch (e: any) {
      lastErr = e;
      // retry only on network/timeout/5xx patterns
      const msg = String(e?.message || "");
      const retryable =
        msg.includes("aborted") ||
        msg.includes("fetch failed") ||
        msg.includes("ECONN") ||
        msg.includes("429") ||
        msg.includes(" 5");

      if (!retryable || attempt === retries) throw lastErr;

      // small backoff
      await new Promise(r => setTimeout(r, 250 * (attempt + 1)));
    }
  }

  throw lastErr;
}
