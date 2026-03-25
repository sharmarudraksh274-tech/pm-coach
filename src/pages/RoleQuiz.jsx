import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Award, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { addXP, isQuizCompleted, recalculateReadinessScore } from "../utils/gameState";

const questions = [
  {
    id: 1,
    question: "What is your professional background?",
    options: [
      { text: "Engineering / Computer Science", scores: { ai: 2, platform: 1 } },
      { text: "Design / UX Research", scores: { consumer: 2, growth: 1 } },
      { text: "Business / Marketing / MBA", scores: { growth: 2, consumer: 1 } },
      { text: "Other (self-taught, career switcher)", scores: { consumer: 1, growth: 1 } },
    ],
  },
  {
    id: 2,
    question: "What motivates you most about Product Management?",
    options: [
      { text: "Solving hard technical problems at scale", scores: { ai: 2, platform: 1 } },
      { text: "Moving metrics and optimising funnels", scores: { growth: 2 } },
      { text: "Building reliable systems other teams depend on", scores: { platform: 2 } },
      { text: "Crafting delightful experiences users love", scores: { consumer: 2 } },
    ],
  },
  {
    id: 3,
    question: "How comfortable are you with technical concepts like APIs, ML models, or system architecture?",
    options: [
      { text: "Very comfortable — I can read code and discuss model architectures", scores: { ai: 2, platform: 1 } },
      { text: "Comfortable enough to collaborate with engineers effectively", scores: { platform: 1, growth: 1 } },
      { text: "I know the basics but prefer to focus on the user side", scores: { consumer: 2 } },
      { text: "Still learning, but eager to get more technical", scores: { growth: 1, consumer: 1 } },
    ],
  },
  {
    id: 4,
    question: "Which product area excites you the most?",
    options: [
      { text: "AI-powered tools, LLMs, and intelligent automation", scores: { ai: 3 } },
      { text: "Acquisition, activation, retention, and monetisation", scores: { growth: 3 } },
      { text: "Developer tools, infrastructure, and internal platforms", scores: { platform: 3 } },
      { text: "Consumer apps, social products, and marketplaces", scores: { consumer: 3 } },
    ],
  },
  {
    id: 5,
    question: "How would you describe your experience with data and analytics?",
    options: [
      { text: "I build dashboards, run SQL queries, and design experiments regularly", scores: { growth: 2, ai: 1 } },
      { text: "I'm comfortable interpreting data but rely on analysts for deep dives", scores: { consumer: 1, platform: 1 } },
      { text: "I work more with system metrics, latency, and reliability data", scores: { platform: 2 } },
      { text: "I focus on qualitative insights — interviews, usability tests, feedback", scores: { consumer: 2 } },
    ],
  },
  {
    id: 6,
    question: "What is your preferred work style?",
    options: [
      { text: "Deep research and prototyping before committing to a direction", scores: { ai: 2 } },
      { text: "Fast iteration — launch, measure, learn, repeat", scores: { growth: 2 } },
      { text: "Careful planning with clear contracts and documentation", scores: { platform: 2 } },
      { text: "Close collaboration with designers and constant user testing", scores: { consumer: 2 } },
    ],
  },
  {
    id: 7,
    question: "What do you consider your core strength?",
    options: [
      { text: "Technical depth and ability to evaluate complex trade-offs", scores: { ai: 2, platform: 1 } },
      { text: "Analytical rigour and experimentation frameworks", scores: { growth: 2 } },
      { text: "Systems thinking and cross-team coordination", scores: { platform: 2 } },
      { text: "Empathy, storytelling, and user advocacy", scores: { consumer: 2 } },
    ],
  },
  {
    id: 8,
    question: "What type of company are you most drawn to?",
    options: [
      { text: "AI-first startups or research labs (OpenAI, DeepMind, Anthropic)", scores: { ai: 3 } },
      { text: "High-growth startups focused on scaling fast", scores: { growth: 2, consumer: 1 } },
      { text: "Big tech building platforms and infrastructure (AWS, Stripe, Twilio)", scores: { platform: 3 } },
      { text: "Consumer-facing companies (Spotify, Airbnb, Instagram)", scores: { consumer: 3 } },
    ],
  },
];

const roleDescriptions = {
  ai: {
    title: "AI Product Manager",
    oneLiner: "Build AI-powered products and work at the intersection of LLMs, no-code tools, and user problems",
    description:
      "You thrive at the intersection of technology and product thinking. You're built to shape the next generation of intelligent products — translating complex ML capabilities into real user value.",
  },
  growth: {
    title: "Growth PM",
    oneLiner: "Drive acquisition, retention, and revenue through experimentation and funnel optimisation",
    description:
      "You're a metrics-driven operator who loves running experiments and optimising funnels. Your superpower is turning data into actionable growth levers that move the needle.",
  },
  platform: {
    title: "Platform PM",
    oneLiner: "Build the infrastructure and APIs that other teams and products depend on",
    description:
      "You think in systems, APIs, and developer experience. You excel at building the foundational layers that empower other teams to ship faster and more reliably.",
  },
  consumer: {
    title: "Consumer PM",
    oneLiner: "Create intuitive, delightful experiences for everyday users at scale",
    description:
      "You lead with empathy and craft products people genuinely love. Your instinct for user needs and eye for delightful experiences make you a natural consumer product builder.",
  },
};

const allRoleKeys = ["ai", "growth", "platform", "consumer"];

export default function RoleQuiz() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [finished, setFinished] = useState(false);
  const [chosenRole, setChosenRole] = useState(null);

  const handleSelect = (optionIndex) => {
    setSelected(optionIndex);
  };

  const handleNext = () => {
    if (selected === null) return;
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    setSelected(null);

    if (current + 1 < questions.length) {
      setCurrent(current + 1);
    } else {
      setFinished(true);
    }
  };

  const handleBack = () => {
    if (current > 0) {
      setCurrent(current - 1);
      setSelected(answers[current - 1]);
      setAnswers(answers.slice(0, -1));
    }
  };

  const getResult = () => {
    const totals = { ai: 0, growth: 0, platform: 0, consumer: 0 };
    answers.forEach((optionIndex, qIndex) => {
      const scores = questions[qIndex].options[optionIndex].scores;
      for (const key in scores) {
        totals[key] += scores[key];
      }
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1])[0][0];
  };

  const progress = ((current + (finished ? 1 : 0)) / questions.length) * 100;

  const roleKeyToStorageValue = {
    ai: "AIPM",
    growth: "Growth PM",
    platform: "Platform PM",
    consumer: "Consumer PM",
  };

  const handleChooseRole = (roleKey) => {
    localStorage.setItem("pmRole", roleKeyToStorageValue[roleKey]);
    if (!isQuizCompleted()) {
      localStorage.setItem("quizCompleted", "true");
      addXP(100);
    }
    recalculateReadinessScore();
    setChosenRole(roleKey);
  };

  if (finished) {
    const resultKey = getResult();
    const result = roleDescriptions[resultKey];
    const alternativeKeys = allRoleKeys.filter((k) => k !== resultKey);

    if (chosenRole) {
      const chosen = roleDescriptions[chosenRole];
      return (
        <div style={styles.container}>
          <motion.div
            style={styles.resultCard}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div style={styles.confirmIcon}>
              <CheckCircle size={48} color="#22c55e" />
            </div>
            <h1 style={{ ...styles.resultTitle, fontSize: "1.8rem", marginBottom: 8 }}>
              You're set as a {chosen.title}!
            </h1>
            <p style={{ ...styles.resultDesc, marginBottom: 32 }}>
              Your learning path has been personalised. Let's get started.
            </p>
            <button
              onClick={() => navigate("/tracks")}
              style={styles.primaryBtn}
            >
              Start My Journey <ArrowRight size={18} />
            </button>
          </motion.div>
        </div>
      );
    }

    return (
      <div style={{ ...styles.container, justifyContent: "flex-start", paddingTop: 80 }}>
        <motion.div
          style={styles.resultCard}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div style={styles.badge}>
            <Award size={20} />
            Your PM Type
          </div>
          <h1 style={styles.resultTitle}>{result.title}</h1>
          <p style={styles.resultDesc}>{result.description}</p>
          <button
            onClick={() => handleChooseRole(resultKey)}
            style={styles.primaryBtn}
          >
            Choose {result.title} <ArrowRight size={18} />
          </button>
        </motion.div>

        {/* Alternative roles */}
        <motion.div
          style={styles.altSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <h3 style={styles.altHeading}>Not what you expected?</h3>
          <div style={styles.altGrid}>
            {alternativeKeys.map((key) => {
              const role = roleDescriptions[key];
              return (
                <div key={key} style={styles.altCard}>
                  <h4 style={styles.altTitle}>{role.title}</h4>
                  <p style={styles.altDesc}>{role.oneLiner}</p>
                  <button
                    onClick={() => handleChooseRole(key)}
                    style={styles.altBtn}
                  >
                    Choose this path instead
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button
            onClick={() => {
              localStorage.removeItem("pmRole");
              localStorage.removeItem("completedTracks");
              localStorage.removeItem("completedTasks");
              localStorage.removeItem("quizCompleted");
              localStorage.setItem("weeklyProgress", "0");
              recalculateReadinessScore();
              setCurrent(0);
              setAnswers([]);
              setSelected(null);
              setFinished(false);
              setChosenRole(null);
            }}
            style={styles.secondaryBtn}
          >
            Retake Quiz
          </button>
        </div>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div style={styles.container}>
      {/* Progress bar */}
      <div style={styles.progressBarBg}>
        <motion.div
          style={styles.progressBarFill}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {current === 0 && (
        <motion.div
          style={{ textAlign: "center", paddingBottom: 40, maxWidth: 640, width: "100%" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#f97316", marginBottom: 10 }}>
            Let's find your perfect PM path
          </h2>
          <p style={{ fontSize: "1rem", color: "#9ca3af", lineHeight: 1.6 }}>
            Understanding your background helps me build a learning journey that fits you — not a generic template.
          </p>
        </motion.div>
      )}

      <div style={styles.quizCard}>
        <div style={styles.questionCount}>
          Question {current + 1} of {questions.length}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            <h2 style={styles.questionText}>{q.question}</h2>

            <div style={styles.optionsGrid}>
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  style={{
                    ...styles.optionBtn,
                    ...(selected === i ? styles.optionSelected : {}),
                  }}
                >
                  <span style={styles.optionLetter}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt.text}
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <div style={styles.navRow}>
          <button
            onClick={handleBack}
            style={{
              ...styles.navBtn,
              visibility: current === 0 ? "hidden" : "visible",
            }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <button
            onClick={handleNext}
            disabled={selected === null}
            style={{
              ...styles.primaryBtn,
              opacity: selected === null ? 0.4 : 1,
              cursor: selected === null ? "not-allowed" : "pointer",
            }}
          >
            {current === questions.length - 1 ? "See Result" : "Next"}{" "}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "calc(100vh - 64px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 24px",
  },
  progressBarBg: {
    position: "fixed",
    top: 64,
    left: 0,
    right: 0,
    height: 3,
    background: "#2a2a2a",
    zIndex: 50,
  },
  progressBarFill: {
    height: "100%",
    background: "#f97316",
    borderRadius: 3,
  },
  quizCard: {
    maxWidth: 640,
    width: "100%",
  },
  questionCount: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#f97316",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  questionText: {
    fontSize: "1.5rem",
    fontWeight: 700,
    lineHeight: 1.35,
    marginBottom: 32,
    color: "#ffffff",
  },
  optionsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginBottom: 36,
  },
  optionBtn: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    width: "100%",
    padding: "16px 20px",
    borderRadius: 12,
    background: "#2a2a2a",
    border: "1px solid #3a3a3a",
    color: "#ffffff",
    fontSize: "0.92rem",
    fontWeight: 500,
    textAlign: "left",
    cursor: "pointer",
    transition: "border-color 0.2s, background 0.2s",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  optionSelected: {
    borderColor: "#f97316",
    background: "rgba(249, 115, 22, 0.12)",
  },
  optionLetter: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: "#333333",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "#a1a1aa",
    flexShrink: 0,
  },
  navRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  navBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 18px",
    borderRadius: 10,
    background: "transparent",
    border: "1px solid #3a3a3a",
    color: "#a1a1aa",
    fontSize: "0.88rem",
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 28px",
    borderRadius: 10,
    background: "#f97316",
    color: "#ffffff",
    fontWeight: 600,
    fontSize: "0.95rem",
    border: "none",
    cursor: "pointer",
    textDecoration: "none",
    fontFamily: "'Inter', system-ui, sans-serif",
    transition: "background 0.2s",
  },
  secondaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 28px",
    borderRadius: 10,
    background: "#2a2a2a",
    color: "#ffffff",
    fontWeight: 600,
    fontSize: "0.95rem",
    border: "1px solid #3a3a3a",
    cursor: "pointer",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  resultCard: {
    maxWidth: 540,
    width: "100%",
    textAlign: "center",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 20px",
    borderRadius: 24,
    background: "rgba(249, 115, 22, 0.15)",
    color: "#f97316",
    fontSize: "0.88rem",
    fontWeight: 600,
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: "2.4rem",
    fontWeight: 800,
    color: "#ffffff",
    marginBottom: 16,
  },
  resultDesc: {
    fontSize: "1.05rem",
    lineHeight: 1.7,
    color: "#a1a1aa",
    marginBottom: 36,
  },
  resultActions: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  confirmIcon: {
    marginBottom: 20,
  },
  altSection: {
    maxWidth: 640,
    width: "100%",
    marginTop: 56,
  },
  altHeading: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 20,
  },
  altGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  altCard: {
    background: "#262626",
    border: "1px solid #3a3a3a",
    borderRadius: 14,
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  altTitle: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#ffffff",
    margin: 0,
  },
  altDesc: {
    fontSize: "0.85rem",
    color: "#9ca3af",
    lineHeight: 1.5,
    margin: 0,
  },
  altBtn: {
    alignSelf: "flex-start",
    marginTop: 4,
    padding: "8px 18px",
    borderRadius: 8,
    background: "rgba(249, 115, 22, 0.12)",
    border: "1px solid rgba(249, 115, 22, 0.3)",
    color: "#f97316",
    fontSize: "0.82rem",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'Inter', system-ui, sans-serif",
    transition: "background 0.2s",
  },
};
