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
import { CHALLENGES } from "../data/challengeData";

const DIFFICULTY_COLORS = {
  Beginner: "#22c55e",
  Intermediate: "#f97316",
  Advanced: "#ef4444",
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

  const themeGroups = CHALLENGES[role] || CHALLENGES["AI/Data PM"];

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.pageTitle}>Practice Challenges</h1>
        <p style={s.pageDesc}>Real-world scenarios for your {role} journey. Complete challenges to earn XP and build your portfolio.</p>
      </div>
      {themeGroups.map((group) => (
        <div key={group.theme} style={s.themeSection}>
          <div style={s.themeHeader}>
            <span style={s.themeDot} />
            <h2 style={s.themeTitle}>{group.theme}</h2>
            <span style={s.themeCount}>{group.challenges.length} challenges</span>
          </div>
          <div style={s.grid}>
            {group.challenges.map((c) => <ChallengeCard key={c.id} challenge={c} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

const s = {
  page: { maxWidth: 780, margin: "0 auto", padding: "48px 24px 80px" },
  header: { marginBottom: 32 },
  pageTitle: { fontSize: "1.8rem", fontWeight: 800, color: "#ffffff", marginBottom: 8 },
  pageDesc: { fontSize: "0.95rem", color: "#9ca3af", lineHeight: 1.5 },
  themeSection: { marginBottom: 40 },
  themeHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16 },
  themeDot: { width: 8, height: 8, borderRadius: "50%", background: "#f97316", flexShrink: 0 },
  themeTitle: { fontSize: "1rem", fontWeight: 700, color: "#ffffff", margin: 0 },
  themeCount: { fontSize: "0.75rem", color: "#9ca3af", fontWeight: 500 },
  grid: { display: "flex", flexDirection: "column", gap: 16 },
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
