import { Router } from "express";

const router = Router();

router.get("/ai/models", async (req, res, next) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(400).json({ ok: false, error: "Missing GROQ_API_KEY" });

    const resp = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` }
    });

    const text = await resp.text();
    if (!resp.ok) throw new Error(`Groq error ${resp.status}: ${text}`);

    res.json({ ok: true, data: JSON.parse(text) });
  } catch (e) {
    next(e);
  }
});

export default router;
