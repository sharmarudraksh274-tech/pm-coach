const API_URL = "http://localhost:3001/api/claude";
const MODEL = "claude-haiku-4-5-20251001";

async function callClaude(systemPrompt, userPrompt, maxTokens) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("[aiHelper] Raw API response:", JSON.stringify(data));
    return data.content[0].text;
  } catch (err) {
    console.error("[aiHelper] API call failed:", err);
    return "Unable to evaluate at this time. Please try again.";
  }
}

export async function generateLesson(topic, pmRole) {
  const systemPrompt =
    "You are a PM Coach teaching aspiring product managers. Generate a structured lesson in this exact format - CONCEPT: (2-3 sentences explaining the core idea) REAL EXAMPLE: (one real company example in 2-3 sentences) KEY TAKEAWAY: (one sentence). Keep it practical and concise.";
  const userPrompt = `Teach me about ${topic} for an aspiring ${pmRole}.`;
  return callClaude(systemPrompt, userPrompt, 1000);
}

const WEIGHT_MAP = {
  Beginner: { Structure: 35, Specificity: 30, "PM Judgement": 20, Metrics: 15 },
  Intermediate: { Structure: 25, Specificity: 25, "PM Judgement": 30, Metrics: 20 },
  Advanced: { Structure: 15, Specificity: 20, "PM Judgement": 35, Metrics: 30 },
};

export async function evaluateAnswer(challenge, difficulty, userAnswer, weakAreas) {
  const weights = WEIGHT_MAP[difficulty] || WEIGHT_MAP.Beginner;

  let weakAreaInstruction = "";
  if (weakAreas && weakAreas.length > 0) {
    weakAreaInstruction = `\n\nThe candidate has these previously identified weak areas: [${weakAreas.join(", ")}]. Check if any of these weak areas appear again in this answer and flag them as recurring.`;
  }

  const systemPrompt = `You are a PM interview coach. Evaluate the candidate's answer using exactly 4 criteria with these weights:
- Structure (${weights.Structure} points): Logical sequence where steps build on each other.
- Specificity (${weights.Specificity} points): Named methods, tools, numbers instead of vague language.
- PM Judgement (${weights["PM Judgement"]} points): Multiple possibilities considered, trade-offs acknowledged.
- Metrics (${weights.Metrics} points): Success defined with measurable outcomes.

Pass threshold per criteria is 60% of that criteria's weight.${weakAreaInstruction}

Respond ONLY in valid JSON with this exact structure:
{
  "criteria": [
    { "name": "Structure", "score": <number>, "maxScore": ${weights.Structure}, "pass": <boolean>, "feedback": "<string>", "weakAreaTag": <string or null> },
    { "name": "Specificity", "score": <number>, "maxScore": ${weights.Specificity}, "pass": <boolean>, "feedback": "<string>", "weakAreaTag": <string or null> },
    { "name": "PM Judgement", "score": <number>, "maxScore": ${weights["PM Judgement"]}, "pass": <boolean>, "feedback": "<string>", "weakAreaTag": <string or null> },
    { "name": "Metrics", "score": <number>, "maxScore": ${weights.Metrics}, "pass": <boolean>, "feedback": "<string>", "weakAreaTag": <string or null> }
  ],
  "totalScore": <number out of 100>,
  "weakAreas": ["<short tags like 'missing-metrics'>"],
  "recurringWeakAreas": ["<tags from input weakAreas that appeared again>"],
  "improvementTip": "<one actionable sentence>"
}`;

  const userPrompt = `Challenge: ${challenge}\n\nCandidate answer: ${userAnswer}`;
  return callClaude(systemPrompt, userPrompt, 1000);
}
