import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config({ path: "server/.env" });

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post("/api/claude", async (req, res) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "placeholder") {
      return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
    }

    const { model, max_tokens, system, messages } = req.body;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model, max_tokens, system, messages }),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("API proxy error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`PM Coach server running on port ${PORT}`);
});
