import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { recommendRole } from "../utils/aiHelper";

const QUESTIONS = [
  {
    id: "Q1",
    text: "What's your background?",
    options: [
      "Engineering / Development",
      "Design / UX / Visual Arts",
      "Marketing / Brand / Content",
      "Data / Analytics / Research",
      "Business / Strategy / Consulting",
      "Operations / Program Management",
      "Other industry (hospitality, education, healthcare, finance, etc.)",
      "Student / No professional background yet",
    ],
  },
  {
    id: "Q2",
    text: "Which problems make you lose track of time?",
    options: [
      "Figuring out why users do what they do",
      "Making messy systems work smoothly",
      "Finding what makes a product spread",
      "Teaching machines to do useful things",
      "Designing the rails other builders run on",
      "Running experiments to see what actually works",
    ],
  },
  {
    id: "Q3",
    text: "Which of these feels most natural to you?",
    options: [
      "Writing docs, specs, or structured plans",
      "Digging through data to spot patterns",
      "Talking to users and running interviews",
      "Sketching flows, wireframes, or journeys",
      "Breaking down how technical systems work",
      "Designing experiments and reading results",
    ],
  },
  {
    id: "Q4",
    text: "What are you genuinely good at today?",
    options: [
      "Storytelling and clear communication",
      "Working with data, SQL, or analytics tools",
      "UX research or design thinking",
      "Engineering or understanding technical systems",
      "Strategy, prioritisation, and trade-offs",
      "Stakeholder management and alignment",
    ],
  },
  {
    id: "Q5",
    text: "How do you currently use AI in your work or life?",
    options: [
      "I've barely used it / still figuring it out",
      "I use ChatGPT or Claude regularly to think and write",
      "I've built workflows or automations using AI tools",
      "I prompt-engineer seriously and compare model outputs",
      "I've shipped something using an LLM API (or want to)",
      "I read AI research, follow model releases, experiment with new tools",
    ],
  },
  {
    id: "Q6",
    text: "Where do you want to be 12 months from now?",
    options: [
      "Landed my first PM role anywhere I can grow",
      "Working as a PM on AI-powered products",
      "Driving growth as a Growth or Lifecycle PM",
      "Owning a platform, API, or infrastructure product",
      "Leading product on a deeply technical team",
      "Switched industries fully into tech product",
    ],
  },
];

const ALL_ROLES = ["Growth PM", "AI/Data PM", "Technical PM", "Platform PM"];

export default function RoleQuiz() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({
    Q1: [], Q2: [], Q3: [], Q4: [], Q5: [], Q6: [],
  });
  const [phase, setPhase] = useState("quiz");
  const [recommendedRole, setRecommendedRole] = useState(null);
  const [aiFluency, setAiFluency] = useState(0);
  const [tagline, setTagline] = useState(null);
  const [showAltRoles, setShowAltRoles] = useState(false);

  const q = QUESTIONS[currentQuestion];
  const qKey = q.id;
  const currentSelections = answers[qKey];
  const hasSelection = currentSelections.length > 0;
  const isLastQuestion = currentQuestion === QUESTIONS.length - 1;
  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;

  const toggleOption = (option) => {
    const updated = currentSelections.includes(option)
      ? currentSelections.filter((o) => o !== option)
      : [...currentSelections, option];
    setAnswers({ ...answers, [qKey]: updated });
  };

  const handleNext = () => {
    if (!hasSelection) return;
    if (isLastQuestion) {
      setPhase("loading");
      recommendRole(answers).then((result) => {
        setRecommendedRole(result.role);
        setAiFluency(result.aiFluency);
        setTagline(result.tagline);
        setPhase("result");
      });
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
  };

  const handleLetsGo = (roleToSave = recommendedRole) => {
    const currentXP = parseInt(localStorage.getItem("xpTotal") || "0", 10);
    localStorage.setItem("pmRole", roleToSave);
    localStorage.setItem("quizCompleted", "true");
    localStorage.setItem("aiFluencyScore", String(aiFluency));
    localStorage.setItem("quizAnswers", JSON.stringify(answers));
    localStorage.setItem("xpTotal", String(currentXP + 100));
    navigate("/");
  };

  if (phase === "loading") {
    return (
      <div style={styles.container}>
        <motion.div
          style={styles.loadingContainer}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            style={styles.loadingDot}
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <p style={styles.loadingText}>Finding your role...</p>
        </motion.div>
      </div>
    );
  }

  if (phase === "result") {
    const altRoles = ALL_ROLES.filter((r) => r !== recommendedRole);
    return (
      <div style={styles.container}>
        <motion.div
          style={styles.resultContainer}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.h1
            style={styles.roleName}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            {recommendedRole}
          </motion.h1>

          {tagline && (
            <motion.p
              style={styles.tagline}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              {tagline}
            </motion.p>
          )}

          <div style={styles.resultButtons}>
            <button
              onClick={() => handleLetsGo()}
              style={{ ...styles.primaryBtn, width: "100%", justifyContent: "center" }}
            >
              Let's go →
            </button>
            <button
              onClick={() => setShowAltRoles((v) => !v)}
              style={styles.ghostBtn}
            >
              I want a different role
            </button>

            {showAltRoles && (
              <motion.div
                style={styles.altRolesGrid}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {altRoles.map((role) => (
                  <button
                    key={role}
                    onClick={() => handleLetsGo(role)}
                    style={styles.altRoleCard}
                  >
                    {role}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

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

      <div style={styles.quizCard}>
        <div style={styles.questionCount}>
          Question {currentQuestion + 1} of 6
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            <h2 style={styles.questionText}>{q.text}</h2>
            <p style={styles.subtitle}>Select all that apply</p>

            <div style={styles.optionsGrid}>
              {q.options.map((option) => {
                const isSelected = currentSelections.includes(option);
                return (
                  <button
                    key={option}
                    onClick={() => toggleOption(option)}
                    style={{
                      ...styles.optionBtn,
                      ...(isSelected ? styles.optionSelected : {}),
                    }}
                  >
                    <span
                      style={{
                        ...styles.checkbox,
                        ...(isSelected ? styles.checkboxSelected : {}),
                      }}
                    >
                      {isSelected && (
                        <Check size={12} color="#ffffff" strokeWidth={3} />
                      )}
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        <div style={styles.navRow}>
          <button
            onClick={handleBack}
            style={{
              ...styles.navBtn,
              visibility: currentQuestion === 0 ? "hidden" : "visible",
            }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <button
            onClick={handleNext}
            disabled={!hasSelection}
            style={{
              ...styles.primaryBtn,
              opacity: !hasSelection ? 0.4 : 1,
              cursor: !hasSelection ? "not-allowed" : "pointer",
            }}
          >
            {isLastQuestion ? (
              "See my role →"
            ) : (
              <><span>Next</span> <ArrowRight size={16} /></>
            )}
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
    marginBottom: 8,
    color: "#ffffff",
  },
  subtitle: {
    fontSize: "0.85rem",
    color: "#9ca3af",
    marginBottom: 24,
    marginTop: 0,
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
    background: "#262626",
    borderWidth: 2,
    borderStyle: "solid",
    borderColor: "#3a3a3a",
    color: "#ffffff",
    fontSize: "0.92rem",
    fontWeight: 500,
    textAlign: "left",
    cursor: "pointer",
    transition: "border-color 0.15s, background 0.15s",
    fontFamily: "system-ui, sans-serif",
  },
  optionSelected: {
    borderColor: "#f97316",
    background: "rgba(249, 115, 22, 0.10)",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    borderWidth: 2,
    borderStyle: "solid",
    borderColor: "#4a4a4a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "border-color 0.15s, background 0.15s",
  },
  checkboxSelected: {
    background: "#f97316",
    borderColor: "#f97316",
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
    fontFamily: "system-ui, sans-serif",
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
    fontFamily: "system-ui, sans-serif",
    transition: "background 0.2s",
  },
  resultContainer: {
    maxWidth: 500,
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: 24,
  },
  roleName: {
    fontSize: "3rem",
    fontWeight: 800,
    color: "#f97316",
    margin: 0,
    lineHeight: 1.1,
  },
  tagline: {
    fontSize: "1rem",
    color: "#9ca3af",
    fontWeight: 500,
    margin: 0,
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: "50%",
    background: "#f97316",
  },
  loadingText: {
    color: "#9ca3af",
    fontSize: "1rem",
    fontWeight: 500,
    margin: 0,
  },
  resultButtons: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    width: "100%",
    maxWidth: 320,
    marginTop: 8,
  },
  ghostBtn: {
    width: "100%",
    padding: "12px 28px",
    borderRadius: 10,
    background: "transparent",
    borderWidth: 2,
    borderStyle: "solid",
    borderColor: "#3a3a3a",
    color: "#9ca3af",
    fontWeight: 600,
    fontSize: "0.95rem",
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
  },
  altRolesGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    width: "100%",
  },
  altRoleCard: {
    width: "100%",
    padding: "16px 20px",
    borderRadius: 12,
    background: "#262626",
    borderWidth: 2,
    borderStyle: "solid",
    borderColor: "#3a3a3a",
    color: "#ffffff",
    fontSize: "0.95rem",
    fontWeight: 600,
    textAlign: "left",
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
  },
};
