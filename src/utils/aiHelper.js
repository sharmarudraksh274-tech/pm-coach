import { calculateRole, AI_FLUENCY_MAP } from './quizScoring.js';

const API_URL = "/api/claude";
const MODEL = "claude-haiku-4-5-20251001";

async function callClaude(systemPrompt, userPrompt, maxTokens, temperature, signal) {
  try {
    const body = {
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    };
    if (temperature !== undefined) body.temperature = temperature;

    const fetchOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    };
    if (signal !== undefined) fetchOptions.signal = signal;

    const response = await fetch(API_URL, fetchOptions);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("[aiHelper] Raw API response:", JSON.stringify(data));
    return data.content[0].text;
  } catch (err) {
    // Re-throw on abort so callers with a timeout can handle their own fallback
    if (signal?.aborted) throw err;
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

const FALLBACK_LINES = {
  'Growth PM':    "Your world was always about people and momentum. Now it's a product.",
  'AI/Data PM':   "You're switching at exactly the right time. The industry is switching with you.",
  'Technical PM': "You've built things. Now you'll decide what gets built.",
  'Platform PM':  "You've always been the person others depend on. Now build the system for it.",
};

const PUNCHY_SYSTEM_PROMPT = `You write one-line role affirmations for aspiring Product Managers who just received their recommended PM role.

Rules:
- Maximum 12 words, ideally 8–10
- Structure: exactly two sentences. First acknowledges their past. Second reframes it as their edge in this role.
- Identity-affirming and forward-looking
- Plain English, no jargon, no clichés ("unlock potential", "journey", "passion")
- Never use the words "perfect", "amazing", "exciting"
- Sound like a smart friend, not a coach

Tone reference (do not copy, match the feel):
- Growth PM: "Your world was always about people and momentum. Now it's a product."
- AI/Data PM: "You're switching at exactly the right time. The industry is switching with you."
- Technical PM: "You've built things. Now you'll decide what gets built."
- Platform PM: "You've always been the person others depend on. Now build the system for it."

Output: ONLY the line. No quotes, no preamble, no explanation.`;

/**
 * Generates a punchy two-sentence affirmation for the quiz result screen.
 *
 * @param {string[]} backgrounds - Q1 selections (user's background choices)
 * @param {'Growth PM'|'AI/Data PM'|'Technical PM'|'Platform PM'} role - Recommended PM role
 * @returns {Promise<string>} Always resolves to a usable string — never throws, never returns null.
 */
const VALID_ROLES = ['Growth PM', 'AI/Data PM', 'Technical PM', 'Platform PM'];

const ROLE_RECOMMEND_SYSTEM = `You are a PM career advisor. Analyze these quiz answers and recommend the single best-fit PM role.

Valid roles — pick exactly one:
- "Growth PM": suits marketing, brand, user research, experimentation, or consumer-facing backgrounds
- "AI/Data PM": suits data, analytics, ML/AI tools usage, technical-adjacent work; fastest-growing PM track in 2025
- "Technical PM": suits engineering/development, system design, technical documentation; high demand in B2B and infrastructure
- "Platform PM": suits operations, program management, API/infrastructure thinking, enabling other builders

Return ONLY valid JSON — no explanation, no markdown:
{"role": "<exact role name from the list>", "tagline": "<4-5 words describing why this role fits this person>"}

Tagline rules:
- Exactly 4-5 words
- No punctuation except spaces
- Reflects the person's specific background, not a generic statement
- Examples: "Your data skills transfer directly" / "Engineering instinct meets product craft" / "Growth is your natural language"`;

const QUESTION_LABELS = {
  Q1: "Background",
  Q2: "Problems that engage them most",
  Q3: "What feels most natural",
  Q4: "Current strengths",
  Q5: "How they currently use AI",
  Q6: "Where they want to be in 12 months",
};

const ROLE_TAGLINE_FALLBACKS = {
  'Growth PM':    'Growth is your natural language',
  'AI/Data PM':   'Data thinking meets product craft',
  'Technical PM': 'Engineering instinct drives decisions',
  'Platform PM':  'Systems thinking at product scale',
};

export async function recommendRole(answers) {
  const aiFluency = (answers.Q5 || []).reduce(
    (sum, opt) => sum + (AI_FLUENCY_MAP[opt] ?? 0), 0
  );

  const lines = Object.entries(QUESTION_LABELS).map(
    ([key, label]) => `${label}: ${(answers[key] || []).join(', ') || 'none selected'}`
  );

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const raw = await callClaude(ROLE_RECOMMEND_SYSTEM, lines.join('\n'), 80, undefined, controller.signal);
    const cleaned = raw.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    const parsed = JSON.parse(cleaned);
    if (VALID_ROLES.includes(parsed.role) && typeof parsed.tagline === 'string') {
      return { role: parsed.role, tagline: parsed.tagline.trim(), aiFluency };
    }
  } catch {
    // fall through to static fallback
  } finally {
    clearTimeout(timer);
  }

  const fallback = calculateRole(answers);
  const tagline = ROLE_TAGLINE_FALLBACKS[fallback.role] ?? ROLE_TAGLINE_FALLBACKS['AI/Data PM'];
  return { role: fallback.role, tagline, aiFluency };
}

export async function generatePunchyLine(backgrounds, role) {
  const fallback = FALLBACK_LINES[role] ?? FALLBACK_LINES['AI/Data PM'];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);

  try {
    const userPrompt = `Background: ${backgrounds.join(', ')}\nRecommended role: ${role}\n\nWrite the line.`;
    const raw = await callClaude(PUNCHY_SYSTEM_PROMPT, userPrompt, 50, 0.8, controller.signal);
    if (!raw) return fallback;
    // Strip surrounding quotes Claude occasionally adds despite instructions
    return raw.replace(/^["“]|["”]$/g, '').trim();
  } catch {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}
