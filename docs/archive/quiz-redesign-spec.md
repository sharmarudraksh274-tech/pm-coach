# Quiz Redesign — Implementation Spec

**Project:** PM Coach
**Scope:** Redesign role recommendation quiz (`/quiz` route)
**Status:** Spec locked, ready to build
**Owner:** Rudraksh

> **After implementation:** Move this file to `/docs/archive/`. Then update `CLAUDE.md` to reflect: new PM roles list (Growth, AI/Data, Technical, Platform — Consumer PM removed), new localStorage keys (`quizAnswers`, `aiFluencyScore`), and updated build order.

---

## 1. Goal

Replace the current 8-question quiz with a 6-question multi-select quiz that recommends ONE PM role from {Growth PM, AI/Data PM, Technical PM, Platform PM} and shows a personalised, AI-generated affirmation line.

**Design philosophy:**
- Keep it quick and engaging — minimise drop-off
- Career switchers and diverse backgrounds are strengths, not gaps
- AI fluency is a real signal, not a vibe
- Single role recommendation, no dual paths
- Conviction over justification on the result screen

---

## 2. What Changes vs. Current Quiz

| Element | Current | New |
|---|---|---|
| Question count | 8 | 6 |
| Selection type | Single-select | Multi-select |
| Option labels | A / B / C / D chips | Checkboxes (filled orange when selected) |
| PM roles | AIPM, Growth PM, Platform PM, Consumer PM | Growth PM, AI/Data PM, Technical PM, Platform PM |
| Result screen | (rebuild) | Role + Claude-generated punchy line + 2 buttons |
| Progress indicator | "Question 2 of 8" | "Question 2 of 6" |
| Header (streak + XP + bar) | Keep | Keep |
| Back navigation | Keep | Keep |

**Note on roles:** Consumer PM is removed. AIPM is renamed to AI/Data PM. Technical PM is added. Existing Consumer PM Learn tracks become orphaned content — handle separately, out of scope here.

---

## 3. The 6 Questions

All questions are **multi-select**. Each question screen shows the question, the subtitle "Select all that apply", and the options. Below options: Back button (left) and Next button (right). Next is enabled only after at least 1 option is selected.

### Q1 — What's your background?
- Engineering / Development
- Design / UX / Visual Arts
- Marketing / Brand / Content
- Data / Analytics / Research
- Business / Strategy / Consulting
- Operations / Program Management
- Other industry (hospitality, education, healthcare, finance, etc.)
- Student / No professional background yet

### Q2 — Which problems make you lose track of time?
- Figuring out why users do what they do
- Making messy systems work smoothly
- Finding what makes a product spread
- Teaching machines to do useful things
- Designing the rails other builders run on
- Running experiments to see what actually works

### Q3 — Which of these feels most natural to you?
- Writing docs, specs, or structured plans
- Digging through data to spot patterns
- Talking to users and running interviews
- Sketching flows, wireframes, or journeys
- Breaking down how technical systems work
- Designing experiments and reading results

### Q4 — What are you genuinely good at today?
- Storytelling and clear communication
- Working with data, SQL, or analytics tools
- UX research or design thinking
- Engineering or understanding technical systems
- Strategy, prioritisation, and trade-offs
- Stakeholder management and alignment

### Q5 — How do you currently use AI in your work or life?
- I've barely used it / still figuring it out
- I use ChatGPT or Claude regularly to think and write
- I've built workflows or automations using AI tools
- I prompt-engineer seriously and compare model outputs
- I've shipped something using an LLM API (or want to)
- I read AI research, follow model releases, experiment with new tools

### Q6 — Where do you want to be 12 months from now?
- Landed my first PM role anywhere I can grow
- Working as a PM on AI-powered products
- Driving growth as a Growth or Lifecycle PM
- Owning a platform, API, or infrastructure product
- Leading product on a deeply technical team
- Switched industries fully into tech product

---

## 4. Scoring Logic

### Approach: Weighted point sum

Each option awards points to one or more roles. After all 6 questions are submitted, points are summed per role, multiplied by the question weight. Highest weighted total wins. Q5 is NOT summed into role totals — it's a tie-breaker only.

### Question weights

| Question | Weight | Rationale |
|---|---|---|
| Q1 Background | ×1.0 | Soft signal |
| Q2 Problems | ×1.2 | Medium-high signal |
| Q3 Natural behaviour | ×1.5 | Hard signal |
| Q4 Skills today | ×1.5 | Hard signal |
| Q5 AI fluency | (tie-breaker only) | Differentiator |
| Q6 Aspiration | ×0.8 | Soft signal — users pick what sounds cool |

### Point mappings

**Roles abbreviated:** G = Growth, AI = AI/Data, T = Technical, P = Platform

#### Q1 — Background (×1.0)
| Option | Points |
|---|---|
| Engineering / Development | T+3, P+2 |
| Design / UX / Visual Arts | G+2, AI+1 |
| Marketing / Brand / Content | G+3 |
| Data / Analytics / Research | AI+3, G+1 |
| Business / Strategy / Consulting | G+2, P+1 |
| Operations / Program Management | P+2, T+1 |
| Other industry | G+1, AI+1 |
| Student / No background | +1 to all |

#### Q2 — Problems (×1.2)
| Option | Points |
|---|---|
| Why users do what they do | G+3 |
| Making messy systems work smoothly | T+3 |
| What makes a product spread | G+3 |
| Teaching machines to do useful things | AI+3 |
| Designing rails other builders run on | P+3 |
| Running experiments | G+2, AI+1 |

#### Q3 — Natural behaviour (×1.5)
| Option | Points |
|---|---|
| Writing docs / specs / structured plans | T+2, P+2 |
| Digging through data | AI+2, G+2 |
| Talking to users | G+3 |
| Sketching flows / wireframes | G+2 |
| Breaking down technical systems | T+3, P+2 |
| Designing experiments | G+2, AI+2 |

#### Q4 — Skills today (×1.5)
| Option | Points |
|---|---|
| Storytelling / communication | G+2 |
| Data, SQL, analytics | AI+3, G+1 |
| UX research / design thinking | G+2 |
| Engineering / technical systems | T+3, P+2 |
| Strategy / prioritisation / trade-offs | P+1, all+1 |
| Stakeholder management | P+1, T+1 |

#### Q5 — AI fluency (TIE-BREAKER ONLY, not summed into role totals)
| Option | AI Score |
|---|---|
| Barely used / figuring out | 0 |
| Use ChatGPT/Claude regularly | 1 |
| Built workflows with AI | 2 |
| Prompt-engineer seriously | 3 |
| Shipped with LLM API | 4 |
| Read research / follow models | 3 |

Sum selected options = AI fluency score (0–16).
- ≥6 → strong AI signal
- ≥3 → moderate
- <3 → low

#### Q6 — Aspiration (×0.8)
| Option | Points |
|---|---|
| First PM role anywhere | +1 to all |
| AI-powered products | AI+3 |
| Growth or Lifecycle PM | G+3 |
| Platform / API / infrastructure | P+3 |
| Deeply technical team | T+3 |
| Switched industries into tech | G+1, AI+1 |

### Final calculation (pseudocode)

```javascript
function calculateRole(answers) {
  const totals = { G: 0, AI: 0, T: 0, P: 0 };
  const weights = { Q1: 1.0, Q2: 1.2, Q3: 1.5, Q4: 1.5, Q6: 0.8 };

  // Sum weighted points across Q1, Q2, Q3, Q4, Q6
  for (const q of ['Q1', 'Q2', 'Q3', 'Q4', 'Q6']) {
    for (const option of answers[q]) {
      const points = POINT_MAP[q][option]; // e.g. { T: 3, P: 2 }
      for (const role in points) {
        totals[role] += points[role] * weights[q];
      }
    }
  }

  // Calculate Q5 AI fluency score
  const aiFluency = answers.Q5.reduce((sum, opt) => sum + AI_FLUENCY_MAP[opt], 0);

  // Edge case: minimal selections → default to AI/Data PM
  const maxScore = Math.max(...Object.values(totals));
  if (maxScore < 5) return { role: 'AI', aiFluency };

  // Find winner
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const [topRole, topScore] = sorted[0];
  const [secondRole, secondScore] = sorted[1];

  // Tie-breaker: top 2 within 10%
  if ((topScore - secondScore) / topScore < 0.1) {
    if (aiFluency >= 3 && (topRole === 'AI' || secondRole === 'AI')) {
      return { role: 'AI', aiFluency };
    }
    // Else: role with higher Q3 (behaviour) score wins — recompute Q3-only totals
    // If still tied: higher Q4 (skills) score wins
    // Final fallback: topRole
  }

  return { role: topRole, aiFluency };
}
```

### Edge cases

| Case | Handling |
|---|---|
| User picks 1 option per question | Scoring still works, totals just lower |
| User picks all options every question | Tie-breaker handles it |
| 3-way tie | Cascade: Q5 AI fluency → Q3 behaviour → Q4 skills → AI/Data PM final fallback |
| Retake quiz | Clear `pmRole`, `completedTracks`, `completedTasks`, restart (per CLAUDE.md) |
| Minimal selections (max score < 5) | Default to AI/Data PM |
| Next button | Disabled until ≥1 option selected for current question |

---

## 5. Result Screen

### Layout (top to bottom)

1. **Header** (existing) — PM Coach logo, streak, XP. Progress bar HIDDEN on this screen.
2. **Recommended role** — large, bold, orange (#f97316), hero element
3. **Punchy line** — Claude-generated, two-sentence affirmation, under 12 words
4. **Two buttons:**
   - **"Let's go →"** (primary, orange fill) → save `pmRole`, +100 XP, redirect to `/`
   - **"I want a different role"** (secondary, ghost/outline) → expands inline below

### Inline "different role" expansion

When tapped, the button area expands to show the OTHER 3 roles as tappable cards. Each card shows just the role name. Tapping a card replaces the current recommendation, saves new `pmRole`, +100 XP, redirects to `/`.

### Animations

- On screen mount: XP counter in header animates from current value → current+100 (small celebration moment).
- Punchy line: skeleton/shimmer state while Claude API call is in flight (~1.5s). Role name appears immediately (calculated locally).

### What's NOT on this screen
- ❌ Score breakdown
- ❌ "Why we picked this" explanation
- ❌ Secondary role suggestion
- ❌ Learning path preview
- ❌ Confidence percentage
- ❌ Role descriptor (intentionally removed — the punchy line IS the personalisation)

---

## 6. Punchy Line — Claude API Integration

### Function location

Add to existing `src/utils/aiHelper.js` alongside `generateLesson` and `evaluateAnswer`.

### Function signature

```javascript
async function generatePunchyLine(backgrounds, role) {
  // backgrounds: array of Q1 selections, e.g. ["Engineering / Development"]
  // role: one of "Growth PM", "AI/Data PM", "Technical PM", "Platform PM"
  // Returns: string (the line) or null on failure
}
```

### Model + settings

- Model: `claude-haiku-4-5-20251001`
- Temperature: 0.8
- Max tokens: 50
- Timeout: 3 seconds (fall back to hardcoded line if exceeded)

### System prompt

```
You write one-line role affirmations for aspiring Product Managers who just received their recommended PM role.

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

Output: ONLY the line. No quotes, no preamble, no explanation.
```

### User prompt template

```
Background: {Q1 selections, comma-separated}
Recommended role: {role}

Write the line.
```

### Fallback lines (use when API fails or times out)

```javascript
const FALLBACK_LINES = {
  "Growth PM": "Your world was always about people and momentum. Now it's a product.",
  "AI/Data PM": "You're switching at exactly the right time. The industry is switching with you.",
  "Technical PM": "You've built things. Now you'll decide what gets built.",
  "Platform PM": "You've always been the person others depend on. Now build the system for it."
};
```

---

## 7. localStorage Keys Affected

| Key | Action |
|---|---|
| `pmRole` | Written on submission (one of: "Growth PM", "AI/Data PM", "Technical PM", "Platform PM") |
| `xpTotal` | Incremented by 100 on quiz completion |
| `quizCompleted` | Set to `true` |
| `quizAnswers` | NEW key — stores the 6 answer arrays for future reference (optional, useful for debugging and the punchy line generation) |
| `aiFluencyScore` | NEW key — stores the Q5 AI fluency score (0–16). Useful for future AI fluency layer mentioned in design intent. |
| `completedTracks` | Cleared if user retakes quiz |
| `completedTasks` | Cleared if user retakes quiz |

**Two new keys to add to the localStorage Key Map in CLAUDE.md:**
- `quizAnswers` — object of arrays, keyed by question ID
- `aiFluencyScore` — number (0–16)

---

## 8. File Changes

### New / modified files

- `src/pages/RoleQuiz.jsx` — rewrite for 6 questions, multi-select UI, new question content
- `src/pages/QuizResult.jsx` — NEW. Result screen.
- `src/utils/quizScoring.js` — NEW. Pure function for scoring logic. Exports `calculateRole(answers)`.
- `src/utils/aiHelper.js` — add `generatePunchyLine()` function
- `src/App.jsx` — add `/quiz/result` route if separating from `/quiz`, OR handle result inside `RoleQuiz.jsx` as a final state

### Recommended structure

Single page with internal state machine: `quiz` → `submitting` → `result`. Avoids a separate route and keeps the experience fluid. URL stays `/quiz` throughout.

---

## 9. Build Order

1. Refactor `RoleQuiz.jsx` to multi-select 6 questions, update progress bar to /6
2. Build `quizScoring.js` with point map and `calculateRole()`
3. Add `generatePunchyLine()` to `aiHelper.js` with fallback logic
4. Build result screen state inside `RoleQuiz.jsx`
5. Wire submit handler: calculate role → call Claude → render result
6. Test: minimal selections, all selections, edge cases
7. Test retake quiz flow
8. Visual QA: spacing, animations, mobile layout

---

## 10. Out of Scope (for this redesign)

- AI fluency layer on top of all tracks (mentioned in design intent — to be designed separately)
- Consumer PM track removal / migration
- Onboarding page (#1 in main build order — separate task)
- Learn page lesson expansion bug (#2 — separate task)
- Greeting fix to use userName (#3 — separate task)

---

## 11. Open Questions for Implementation

None at spec level. If anything is ambiguous during build, ask before deviating.

## 12. Rules to Respect (from CLAUDE.md)

- Never change colors, fonts, or navigation design
- Always use localStorage — no external DB
- Ask before installing new dependencies
- Keep solutions simple — MVP, hard deadline
- After completing the task, state which localStorage keys were affected
- Never hardcode XP, streak, or level values — always read from localStorage
