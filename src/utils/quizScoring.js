/** Maps internal role abbreviations to full display names. */
const ROLE_NAMES = {
  G:  'Growth PM',
  AI: 'AI/Data PM',
  T:  'Technical PM',
  P:  'Platform PM',
};

/**
 * Point awards per question option.
 * Keys must match option strings EXACTLY as shown in the quiz UI (section 3 of spec).
 * Q5 is excluded — it feeds AI_FLUENCY_MAP, not role totals.
 */
export const POINT_MAP = {
  Q1: {
    'Engineering / Development':                                             { T: 3, P: 2 },
    'Design / UX / Visual Arts':                                            { G: 2, AI: 1 },
    'Marketing / Brand / Content':                                          { G: 3 },
    'Data / Analytics / Research':                                          { AI: 3, G: 1 },
    'Business / Strategy / Consulting':                                     { G: 2, P: 1 },
    'Operations / Program Management':                                      { P: 2, T: 1 },
    'Other industry (hospitality, education, healthcare, finance, etc.)':   { G: 1, AI: 1 },
    'Student / No professional background yet':                             { G: 1, AI: 1, T: 1, P: 1 },
  },
  Q2: {
    'Figuring out why users do what they do':             { G: 3 },
    'Making messy systems work smoothly':                { T: 3 },
    'Finding what makes a product spread':               { G: 3 },
    'Teaching machines to do useful things':             { AI: 3 },
    'Designing the rails other builders run on':         { P: 3 },
    'Running experiments to see what actually works':    { G: 2, AI: 1 },
  },
  Q3: {
    'Writing docs, specs, or structured plans':          { T: 2, P: 2 },
    'Digging through data to spot patterns':             { AI: 2, G: 2 },
    'Talking to users and running interviews':           { G: 3 },
    'Sketching flows, wireframes, or journeys':          { G: 2 },
    'Breaking down how technical systems work':          { T: 3, P: 2 },
    'Designing experiments and reading results':         { G: 2, AI: 2 },
  },
  Q4: {
    'Storytelling and clear communication':              { G: 2 },
    'Working with data, SQL, or analytics tools':        { AI: 3, G: 1 },
    'UX research or design thinking':                    { G: 2 },
    'Engineering or understanding technical systems':    { T: 3, P: 2 },
    // "P+1, all+1" from spec → P receives both, so P=2, others=1
    'Strategy, prioritisation, and trade-offs':          { G: 1, AI: 1, T: 1, P: 2 },
    'Stakeholder management and alignment':              { P: 1, T: 1 },
  },
  Q6: {
    'Landed my first PM role anywhere I can grow':       { G: 1, AI: 1, T: 1, P: 1 },
    'Working as a PM on AI-powered products':            { AI: 3 },
    'Driving growth as a Growth or Lifecycle PM':        { G: 3 },
    'Owning a platform, API, or infrastructure product': { P: 3 },
    'Leading product on a deeply technical team':        { T: 3 },
    'Switched industries fully into tech product':       { G: 1, AI: 1 },
  },
};

/**
 * AI fluency scores for Q5 options (tie-breaker only — not added to role totals).
 * Max possible score: 16 (all options selected at highest values).
 */
export const AI_FLUENCY_MAP = {
  "I've barely used it / still figuring it out":                          0,
  "I use ChatGPT or Claude regularly to think and write":                  1,
  "I've built workflows or automations using AI tools":                   2,
  "I prompt-engineer seriously and compare model outputs":                 3,
  "I've shipped something using an LLM API (or want to)":                 4,
  "I read AI research, follow model releases, experiment with new tools":  3,
};

/** Question weights applied to raw point sums. Q5 has no weight (tie-breaker only). */
export const QUESTION_WEIGHTS = { Q1: 1.0, Q2: 1.2, Q3: 1.5, Q4: 1.5, Q6: 0.8 };

/**
 * Sums raw (unweighted) points for a single question across a restricted set of roles.
 * Used internally during tie-breaker cascade.
 */
function questionScores(q, answers, roles) {
  const scores = Object.fromEntries(roles.map(r => [r, 0]));
  for (const option of (answers[q] || [])) {
    const pts = POINT_MAP[q]?.[option];
    if (!pts) continue;
    for (const role of roles) {
      scores[role] += pts[role] ?? 0;
    }
  }
  return scores;
}

/**
 * Calculates the recommended PM role from a completed set of quiz answers.
 *
 * @param {Object} answers - Selections keyed by question ID.
 *   Shape: { Q1: string[], Q2: string[], Q3: string[], Q4: string[], Q5: string[], Q6: string[] }
 * @returns {{ role: 'Growth PM'|'AI/Data PM'|'Technical PM'|'Platform PM', aiFluency: number }}
 *   `role` is the recommended PM track. `aiFluency` is the raw Q5 score (0–16).
 */
export function calculateRole(answers) {
  const totals = { G: 0, AI: 0, T: 0, P: 0 };

  // Weighted point accumulation across Q1, Q2, Q3, Q4, Q6
  for (const q of ['Q1', 'Q2', 'Q3', 'Q4', 'Q6']) {
    const weight = QUESTION_WEIGHTS[q];
    for (const option of (answers[q] || [])) {
      const pts = POINT_MAP[q]?.[option];
      if (!pts) continue;
      for (const role in pts) {
        totals[role] += pts[role] * weight;
      }
    }
  }

  // Q5: AI fluency score (tie-breaker only)
  const aiFluency = (answers.Q5 || []).reduce(
    (sum, opt) => sum + (AI_FLUENCY_MAP[opt] ?? 0),
    0
  );

  // Minimal selections edge case — user barely engaged
  const maxScore = Math.max(...Object.values(totals));
  if (maxScore < 5) {
    return { role: 'AI/Data PM', aiFluency };
  }

  // Sort roles highest → lowest
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const topScore = sorted[0][1];

  // Tied group: all roles within 10% of the top score
  const tied = sorted
    .filter(([, score]) => (topScore - score) / topScore < 0.1)
    .map(([role]) => role);

  // Clear winner — no tie-breaker needed
  if (tied.length === 1) {
    return { role: ROLE_NAMES[tied[0]], aiFluency };
  }

  // Cascade step 1 — Q5 AI fluency: if signal is moderate-or-strong and AI/Data is in the tie
  if (aiFluency >= 3 && tied.includes('AI')) {
    return { role: 'AI/Data PM', aiFluency };
  }

  // Cascade step 2 — Q3 (natural behaviour): highest raw score among tied roles wins
  const q3 = questionScores('Q3', answers, tied);
  const maxQ3 = Math.max(...Object.values(q3));
  const afterQ3 = tied.filter(r => q3[r] === maxQ3);

  if (afterQ3.length === 1) {
    return { role: ROLE_NAMES[afterQ3[0]], aiFluency };
  }

  // Cascade step 3 — Q4 (skills today): highest raw score among remaining roles wins
  const q4 = questionScores('Q4', answers, afterQ3);
  const maxQ4 = Math.max(...Object.values(q4));
  const afterQ4 = afterQ3.filter(r => q4[r] === maxQ4);

  if (afterQ4.length === 1) {
    return { role: ROLE_NAMES[afterQ4[0]], aiFluency };
  }

  // Final fallback — absolute tie exhausted all cascade steps
  return { role: 'AI/Data PM', aiFluency };
}
