export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log("[claude] key prefix:", apiKey ? apiKey.slice(0, 15) : "MISSING", "| length:", apiKey ? apiKey.length : 0);
  if (!apiKey || apiKey === "placeholder") {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  const { model, max_tokens, system, messages, temperature } = req.body;

  const claudeBody = { model, max_tokens, system, messages };
  if (temperature !== undefined) claudeBody.temperature = temperature;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(claudeBody),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
