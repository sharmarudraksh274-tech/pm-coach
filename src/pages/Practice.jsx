import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  ArrowRight,
  CheckCircle,
  XCircle,
  ChevronDown,
  Zap,
  Loader,
  AlertTriangle,
} from "lucide-react";
import { getRole, addXP } from "../utils/gameState";
import { evaluateAnswer } from "../utils/aiHelper";

const DIFFICULTY_COLORS = {
  Beginner: "#22c55e",
  Intermediate: "#f97316",
  Advanced: "#ef4444",
};

const CHALLENGES = {
  AIPM: [
    {
      id: "practice-aipm-1",
      difficulty: "Beginner",
      title: "Define the AI Feature",
      xp: 150,
      scenario: "Notion wants to add an AI writing assistant. Write a one-page PRD defining the problem, user, and core feature.",
    },
    {
      id: "practice-aipm-2",
      difficulty: "Intermediate",
      title: "Prioritise the Roadmap",
      xp: 200,
      scenario: "You are PM for an AI email tool with 5 feature requests. Prioritise them using RICE scoring and justify your top pick.",
    },
    {
      id: "practice-aipm-3",
      difficulty: "Advanced",
      title: "Handle the Failure",
      xp: 300,
      scenario: "Your AI feature launched last week. Engagement is 40% below target. Walk through how you diagnose the problem and what you do next.",
    },
  ],
  "Growth PM": [
    {
      id: "practice-growth-1",
      difficulty: "Beginner",
      title: "Map the Funnel",
      xp: 150,
      scenario: "Pick any app you use daily. Draw the acquisition to retention funnel and identify the single biggest drop-off point.",
    },
    {
      id: "practice-growth-2",
      difficulty: "Intermediate",
      title: "Design the Experiment",
      xp: 200,
      scenario: "Duolingo wants to improve D7 retention by 10%. Design an A/B test with hypothesis, variants, metric, and success criteria.",
    },
    {
      id: "practice-growth-3",
      difficulty: "Advanced",
      title: "Fix the Metric",
      xp: 300,
      scenario: "Your activation rate dropped from 62% to 48% in two weeks. No product changes were made. Walk through how you investigate and respond.",
    },
  ],
  "Platform PM": [
    {
      id: "practice-platform-1",
      difficulty: "Beginner",
      title: "Design the API",
      xp: 150,
      scenario: "Stripe wants to add a webhook for failed payments. Define the API contract — endpoint, payload, error states, and developer docs outline.",
    },
    {
      id: "practice-platform-2",
      difficulty: "Intermediate",
      title: "Write the Technical PRD",
      xp: 200,
      scenario: "Your team needs to build a rate-limiting system for your public API. Write a technical PRD covering problem, requirements, and edge cases.",
    },
    {
      id: "practice-platform-3",
      difficulty: "Advanced",
      title: "Handle the Incident",
      xp: 300,
      scenario: "Your platform API is returning 500 errors for 15% of requests. Walk through your incident response process step by step.",
    },
  ],
  "Consumer PM": [
    {
      id: "practice-consumer-1",
      difficulty: "Beginner",
      title: "Teardown the App",
      xp: 150,
      scenario: "Pick any consumer app. Do a 10-minute teardown — identify the core user, their JTBD, and 3 UX improvements.",
    },
    {
      id: "practice-consumer-2",
      difficulty: "Intermediate",
      title: "Redesign the Flow",
      xp: 200,
      scenario: "Swiggy's checkout has 35% drop-off. You have one sprint. What do you change and why?",
    },
    {
      id: "practice-consumer-3",
      difficulty: "Advanced",
      title: "Launch the Feature",
      xp: 300,
      scenario: "You are launching a social sharing feature for a fitness app. Define your GTM plan, success metrics, and what you watch in the first 48 hours.",
    },
  ],
};

function getCompletedChallenges() {
  try {
    const val = localStorage.getItem("completedChallenges");
    return val ? JSON.parse(val) : [];
  } catch {
    return [];
  }
}

function saveCompletedChallenge(id) {
  const completed = getCompletedChallenges();
  if (!completed.includes(id)) {
    completed.push(id);
    localStorage.setItem("completedChallenges", JSON.stringify(completed));
  }
}

function getChallengeResults() {
  try {
    const val = localStorage.getItem("challengeResults");
    return val ? JSON.parse(val) : [];
  } catch {
    return [];
  }
}

function saveChallengeResult(result) {
  const all = getChallengeResults();
  const existing = all.findIndex((r) => r.challengeId === result.challengeId);
  if (existing >= 0) {
    all[existing] = result;
  } else {
    all.push(result);
  }
  localStorage.setItem("challengeResults", JSON.stringify(all));
}

function getSavedResult(challengeId) {
  return getChallengeResults().find((r) => r.challengeId === challengeId) || null;
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function parseAIResponse(raw) {
  console.log("[Practice] Raw AI response:", raw);
  try {
    // Strip markdown backticks wrapping (e.g. ```json ... ``` or ``` ... ```)
    let cleaned = raw.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?\s*```$/i, "");
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("[Practice] Failed to parse AI response:", err);
    return null;
  }
}

function getWeakAreas() {
  try {
    const val = localStorage.getItem("weakAreas");
    return val ? JSON.parse(val) : [];
  } catch {
    return [];
  }
}

function saveWeakAreas(newTags) {
  const existing = getWeakAreas();
  const merged = [...new Set([...existing, ...newTags])];
  localStorage.setItem("weakAreas", JSON.stringify(merged));
}

function ChallengeCard({ challenge }) {
  const [expanded, setExpanded] = useState(false);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [earnedXP, setEarnedXP] = useState(0);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [viewingSaved, setViewingSaved] = useState(false);

  useEffect(() => {
    if (getCompletedChallenges().includes(challenge.id)) {
      setAlreadyDone(true);
    }
  }, [challenge.id]);

  const diffColor = DIFFICULTY_COLORS[challenge.difficulty];
  const wordCount = countWords(answer);

  const handleViewResults = () => {
    const saved = getSavedResult(challenge.id);
    if (saved) {
      setAnswer(saved.userAnswer);
      setResults(saved.aiEvaluation);
      setEarnedXP(saved.xpEarned);
      setViewingSaved(true);
    }
  };

  const handleSubmit = async () => {
    if (wordCount < 50) {
      setError("Please write at least 50 words to submit.");
      return;
    }
    setError("");
    setLoading(true);

    const challengeContext = challenge.title + " " + challenge.scenario;
    const weakAreas = getWeakAreas();

    const raw = await evaluateAnswer(
      challengeContext,
      challenge.difficulty,
      answer,
      weakAreas
    );

    const parsed = parseAIResponse(raw);

    if (!parsed || !parsed.criteria) {
      setError("AI evaluation failed. Please try again.");
      setLoading(false);
      return;
    }

    const xp = Math.round((parsed.totalScore / 100) * challenge.xp);

    // Save weak areas to localStorage (merge, no duplicates)
    if (parsed.weakAreas && parsed.weakAreas.length > 0) {
      saveWeakAreas(parsed.weakAreas);
    }

    addXP(xp);
    saveCompletedChallenge(challenge.id);
    saveChallengeResult({
      challengeId: challenge.id,
      userAnswer: answer,
      aiEvaluation: parsed,
      xpEarned: xp,
      completedAt: new Date().toISOString(),
    });

    setEarnedXP(xp);
    setResults(parsed);
    setLoading(false);
  };

  // Completed state — show View Results button
  if (alreadyDone && !viewingSaved && !results) {
    return (
      <motion.div style={s.card} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={s.cardHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ ...s.badge, background: `${diffColor}20`, color: diffColor }}>{challenge.difficulty}</span>
            <CheckCircle size={18} color="#22c55e" />
          </div>
          <span style={s.xpTag}>+{challenge.xp} XP</span>
        </div>
        <h3 style={s.cardTitle}>{challenge.title}</h3>
        <div style={s.completedBanner}><CheckCircle size={16} /> Challenge Complete — {challenge.xp} XP earned</div>
        {getSavedResult(challenge.id) && (
          <button style={s.viewResultsBtn} onClick={handleViewResults}>
            View Results <ArrowRight size={14} />
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div style={s.card} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div style={s.cardHeader}>
        <span style={{ ...s.badge, background: `${diffColor}20`, color: diffColor }}>{challenge.difficulty}</span>
        <span style={s.xpTag}><Zap size={14} /> +{challenge.xp} XP</span>
      </div>
      <h3 style={s.cardTitle}>{challenge.title}</h3>
      <p style={s.scenario}>{challenge.scenario}</p>

      {!expanded && !results && (
        <button style={s.startBtn} onClick={() => setExpanded(true)}>
          Start Challenge <ChevronDown size={16} />
        </button>
      )}

      {/* STEP 2 — Workspace */}
      <AnimatePresence>
        {expanded && !loading && !results && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div style={s.divider} />
            <textarea
              style={s.textarea}
              placeholder="Write your response here — minimum 50 words"
              value={answer}
              onChange={(e) => { setAnswer(e.target.value); if (error) setError(""); }}
              rows={8}
            />
            <p style={{ ...s.wordCount, color: wordCount >= 50 ? "#22c55e" : "#9ca3af" }}>
              {wordCount} / 50 words {wordCount >= 50 ? "✓" : ""}
            </p>
            {error && <p style={s.error}>{error}</p>}
            <button style={{ ...s.submitBtn, opacity: loading ? 0.6 : 1 }} onClick={handleSubmit}>
              Submit for AI Evaluation
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STEP 3 — Loading */}
      {loading && (
        <motion.div style={s.loadingBox} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Loader size={24} color="#f97316" style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ color: "#f97316", fontWeight: 600 }}>AI is reviewing your answer...</span>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </motion.div>
      )}

      {/* STEP 4 — Results */}
      {results && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 20 }}>
          {/* Your Answer */}
          <div style={s.resultSection}>
            <p style={s.resultLabel}>Your Answer</p>
            <div style={s.answerBox}>{answer}</div>
          </div>

          {/* AI Evaluation — 4 Criteria */}
          <div style={s.resultSection}>
            <p style={s.resultLabel}>AI Evaluation</p>
            <div style={s.evalBox}>
              {results.criteria.map((c, i) => (
                <div key={i} style={s.evalRow}>
                  {c.pass ? <CheckCircle size={16} color="#22c55e" /> : <XCircle size={16} color="#ef4444" />}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "0.85rem" }}>{c.name}</span>
                      <span style={{ color: c.pass ? "#22c55e" : "#ef4444", fontWeight: 600, fontSize: "0.82rem" }}>
                        {c.score}/{c.maxScore}
                      </span>
                      <span style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 6,
                        background: c.pass ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                        color: c.pass ? "#22c55e" : "#ef4444",
                        textTransform: "uppercase",
                      }}>
                        {c.pass ? "Pass" : "Fail"}
                      </span>
                      {results.recurringWeakAreas && c.weakAreaTag && results.recurringWeakAreas.includes(c.weakAreaTag) && (
                        <span style={{
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: "rgba(249,115,22,0.15)",
                          color: "#f97316",
                          textTransform: "uppercase",
                        }}>
                          Recurring
                        </span>
                      )}
                    </div>
                    <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginTop: 4, lineHeight: 1.5 }}>{c.feedback}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Score */}
          <div style={s.totalScore}>
            <span style={{ fontSize: "1.5rem", fontWeight: 800 }}>{results.totalScore}</span>
            <span style={{ fontSize: "0.9rem", color: "#9ca3af" }}> / 100</span>
          </div>

          {/* XP earned */}
          <div style={s.xpEarned}>
            <Zap size={18} /> You earned {earnedXP} XP
          </div>

          {/* Improvement Tip */}
          {results.improvementTip && (
            <div style={s.tipBox}>
              <AlertTriangle size={16} color="#f97316" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.5, color: "#ffffff" }}>{results.improvementTip}</p>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

export default function Practice() {
  const role = getRole();

  if (!role) {
    return (
      <div style={s.page}>
        <div style={s.emptyState}>
          <Target size={40} color="#f97316" />
          <h2 style={s.emptyTitle}>Complete the Role Quiz first to unlock your challenges</h2>
          <Link to="/quiz" style={s.quizBtn}>Take the Quiz <ArrowRight size={18} /></Link>
        </div>
      </div>
    );
  }

  const challenges = CHALLENGES[role] || CHALLENGES.AIPM;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.pageTitle}>Practice Challenges</h1>
        <p style={s.pageDesc}>Real-world scenarios for your {role} journey. Complete challenges to earn XP and build your portfolio.</p>
      </div>
      <div style={s.grid}>
        {challenges.map((c) => <ChallengeCard key={c.id} challenge={c} />)}
      </div>
    </div>
  );
}

const s = {
  page: { maxWidth: 780, margin: "0 auto", padding: "48px 24px 80px" },
  header: { marginBottom: 32 },
  pageTitle: { fontSize: "1.8rem", fontWeight: 800, color: "#ffffff", marginBottom: 8 },
  pageDesc: { fontSize: "0.95rem", color: "#9ca3af", lineHeight: 1.5 },
  grid: { display: "flex", flexDirection: "column", gap: 20 },
  card: { background: "#262626", borderRadius: 12, padding: 24, border: "1px solid #333333" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  badge: { fontSize: "0.75rem", fontWeight: 700, padding: "4px 12px", borderRadius: 20, textTransform: "uppercase", letterSpacing: 0.5 },
  xpTag: { display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.82rem", fontWeight: 600, color: "#f97316" },
  cardTitle: { fontSize: "1.15rem", fontWeight: 700, color: "#ffffff", marginBottom: 8 },
  scenario: { fontSize: "0.9rem", color: "#9ca3af", lineHeight: 1.6, marginBottom: 16, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  startBtn: { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 22px", borderRadius: 10, background: "#f97316", color: "#ffffff", fontWeight: 600, fontSize: "0.9rem", border: "none", cursor: "pointer" },
  divider: { height: 1, background: "#3a3a3a", margin: "20px 0" },
  textarea: { width: "100%", padding: 16, borderRadius: 10, border: "1px solid #3a3a3a", background: "#1a1a1a", color: "#ffffff", fontSize: "0.9rem", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  wordCount: { fontSize: "0.78rem", marginTop: 6, marginBottom: 4 },
  error: { color: "#ef4444", fontSize: "0.82rem", marginTop: 4, marginBottom: 8 },
  submitBtn: { display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 10, background: "#f97316", color: "#ffffff", fontWeight: 600, fontSize: "0.9rem", border: "none", cursor: "pointer", marginTop: 12 },
  loadingBox: { display: "flex", alignItems: "center", gap: 12, justifyContent: "center", padding: "32px 0", marginTop: 20 },
  resultSection: { marginBottom: 20 },
  resultLabel: { fontSize: "0.85rem", fontWeight: 700, color: "#ffffff", marginBottom: 8 },
  answerBox: { background: "#1a1a1a", borderRadius: 10, padding: 16, fontSize: "0.88rem", color: "#9ca3af", lineHeight: 1.6 },
  evalBox: { display: "flex", flexDirection: "column", gap: 14 },
  evalRow: { display: "flex", gap: 10, alignItems: "flex-start" },
  totalScore: { display: "flex", alignItems: "baseline", justifyContent: "center", gap: 2, padding: 16, borderRadius: 10, background: "#1a1a1a", border: "1px solid #3a3a3a", color: "#ffffff", marginTop: 8, marginBottom: 8 },
  xpEarned: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 10, background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)", color: "#f97316", fontWeight: 700, fontSize: "1rem", marginTop: 12, marginBottom: 12 },
  tipBox: { display: "flex", gap: 10, alignItems: "flex-start", padding: 16, borderRadius: 10, background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.25)", marginTop: 4 },
  completedBanner: { display: "flex", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", fontWeight: 600, fontSize: "0.85rem", marginTop: 12 },
  viewResultsBtn: { display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, padding: "8px 16px", borderRadius: 8, background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.3)", color: "#f97316", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" },
  emptyState: { textAlign: "center", padding: "120px 24px" },
  emptyTitle: { fontSize: "1.3rem", fontWeight: 700, color: "#ffffff", marginTop: 20, marginBottom: 24, lineHeight: 1.5 },
  quizBtn: { display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", borderRadius: 10, background: "#f97316", color: "#ffffff", fontWeight: 600, fontSize: "0.95rem", textDecoration: "none" },
};
