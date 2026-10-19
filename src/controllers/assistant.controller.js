import config from "../config.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM_PROMPT =
  "You are NearHelp's concise local-help assistant. Help users understand how to find nearby public services and use the app. Never claim to know live availability, opening hours, or a user's location unless they provide it. For immediate danger in India, advise calling 112. Do not provide medical diagnosis or replace emergency services. Answer in clear English unless the user explicitly writes in Hindi; then a brief Hindi answer is acceptable.";

export async function askAssistant(req, res, next) {
  try {
    const question =
      typeof req.body.question === "string" ? req.body.question.trim() : "";

    if (!question || question.length > 1000) {
      return res.status(400).json({
        error: "Enter a question between 1 and 1,000 characters.",
      });
    }

    if (!config.openrouterApiKey) {
      return res.status(503).json({
        error: "The AI assistant is not configured yet. Add OPENROUTER_API_KEY to the server environment.",
      });
    }

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.openrouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "NearHelp",
      },
      body: JSON.stringify({
        model: config.openrouterModel,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: question },
        ],
        max_tokens: 300,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error(
        "AI provider request failed",
        response.status,
        data.error?.code || "unknown"
      );

      const errors = {
        401: "OpenRouter rejected the API key. Check that OPENROUTER_API_KEY in .env is a valid, active key, then restart the server.",
        402: "Your OpenRouter account has insufficient credits. Add credits at openrouter.ai and try again.",
        403: "This OpenRouter key does not have access to the configured model. Check OPENROUTER_MODEL in .env and your account.",
        404: "The configured model was not found on OpenRouter. Check OPENROUTER_MODEL in .env.",
        429: "OpenRouter rate limit reached. Wait a moment and try again.",
      };

      return res.status(502).json({
        error:
          errors[response.status] ||
          "The AI provider is temporarily unavailable. Please try again later.",
      });
    }

    const answer = data.choices?.[0]?.message?.content?.trim() || "";

    if (!answer) {
      return res.status(502).json({
        error: "The AI assistant returned an empty answer. Please try again.",
      });
    }

    return res.json({ answer });
  } catch (error) {
    next(error);
  }
}
