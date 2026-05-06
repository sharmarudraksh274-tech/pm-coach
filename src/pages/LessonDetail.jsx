import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, ChevronDown, ChevronUp, PenLine } from "lucide-react";
import { generateLesson } from "../utils/aiHelper";
import {
  getRole,
  getTrackProgress,
  startTrack,
  completeLessonInTrack,
} from "../utils/gameState";
import { TRACK_META, LESSON_TITLES } from "../data/lessonData";

function parseLesson(raw) {
  const conceptMatch = raw.match(/CONCEPT:\s*([\s\S]*?)(?=REAL EXAMPLE:|$)/i);
  const exampleMatch = raw.match(/REAL EXAMPLE:\s*([\s\S]*?)(?=KEY TAKEAWAY:|$)/i);
  const takeawayMatch = raw.match(/KEY TAKEAWAY:\s*([\s\S]*?)$/i);
  const concept = conceptMatch?.[1]?.trim();
  const example = exampleMatch?.[1]?.trim();
  const takeaway = takeawayMatch?.[1]?.trim();
  if (!concept && !example && !takeaway) return null;
  return { concept: concept || "", example: example || "", takeaway: takeaway || "" };
}

export default function LessonDetail() {
  const { trackId, lessonIndex } = useParams();
  const navigate = useNavigate();
  const lessonIdx = parseInt(lessonIndex, 10);

  const role = getRole();
  const track = TRACK_META[trackId];
  const lessonTitle = LESSON_TITLES[trackId]?.[lessonIdx] || `Lesson ${lessonIdx + 1}`;

  const noteKey = `lessonNote_${trackId}_${lessonIdx}`;

  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    const progress = getTrackProgress(trackId);
    if (progress?.lessonsCompleted.includes(lessonIdx)) {
      setIsComplete(true);
    }

    const savedNote = localStorage.getItem(noteKey);
    if (savedNote) setNoteText(savedNote);

    const cacheKey = `lessonContent_${trackId}_${lessonIdx}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = parseLesson(cached);
      if (parsed) {
        setContent(parsed);
        setLoading(false);
        return;
      }
    }

    generateLesson(lessonTitle, role).then((raw) => {
      console.log("[LessonDetail] raw received:", raw ? raw.substring(0, 120) : "EMPTY/NULL");
      if (!raw || raw.startsWith("Unable to evaluate")) {
        setError(true);
        setLoading(false);
        return;
      }
      localStorage.setItem(cacheKey, raw);
      const parsed = parseLesson(raw);
      if (parsed) {
        setContent(parsed);
      } else {
        setError(true);
      }
      setLoading(false);
    });
  }, [trackId, lessonIdx]);

  const handleNoteChange = (e) => {
    const val = e.target.value;
    setNoteText(val);
    localStorage.setItem(noteKey, val);
  };

  const handleComplete = () => {
    const progress = getTrackProgress(trackId);
    if (!progress) startTrack(trackId, track.totalLessons);
    completeLessonInTrack(trackId, lessonIdx);
    setIsComplete(true);
    setJustCompleted(true);
    setTimeout(() => navigate("/learn"), 900);
  };

  if (!track) {
    return (
      <div style={styles.container}>
        <p style={{ color: "#9ca3af" }}>Track not found.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate("/learn")} style={styles.backBtn}>
          <ArrowLeft size={16} /> Back to Learn
        </button>
        <span style={{ ...styles.trackBadge, background: `${track.color}20`, color: track.color }}>
          {track.title}
        </span>
      </div>

      <div style={styles.lessonMeta}>
        <span style={styles.lessonNumber}>Lesson {lessonIdx + 1}</span>
        <h1 style={styles.lessonTitle}>{lessonTitle}</h1>
      </div>

      {loading && <LoadingShimmer />}

      {error && !loading && (
        <div style={styles.errorBox}>
          <p style={{ margin: 0, color: "#9ca3af" }}>
            Couldn't load this lesson right now. Check your connection and try again.
          </p>
        </div>
      )}

      {!loading && !error && content && (
        <div style={styles.layout}>
          {/* Left — lesson content */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={styles.mainContent}
          >
            <Section label="Concept" text={content.concept} color={track.color} />
            <Section label="Real Example" text={content.example} color={track.color} />
            <Section label="Key Takeaway" text={content.takeaway} color={track.color} highlight />

            <div style={styles.actionArea}>
              {justCompleted ? (
                <motion.div
                  style={styles.completedBadge}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <CheckCircle size={18} />
                  Lesson complete — XP earned
                </motion.div>
              ) : isComplete ? (
                <div style={styles.completedBadge}>
                  <CheckCircle size={18} />
                  Already completed
                </div>
              ) : (
                <button
                  onClick={handleComplete}
                  style={{ ...styles.completeBtn, background: track.color }}
                >
                  Mark as Complete
                </button>
              )}
            </div>
          </motion.div>

          {/* Right — notes panel */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            style={styles.notesSidebar}
          >
            <div style={styles.notesWrapper}>
              <button
                onClick={() => setNotesOpen((v) => !v)}
                style={styles.notesToggle}
              >
                <span style={styles.notesToggleLeft}>
                  <PenLine size={15} color="#9ca3af" />
                  <span>My Notes</span>
                  {noteText.trim() && <span style={styles.notesDot} />}
                </span>
                {notesOpen
                  ? <ChevronUp size={15} color="#9ca3af" />
                  : <ChevronDown size={15} color="#9ca3af" />}
              </button>

              {notesOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <textarea
                    value={noteText}
                    onChange={handleNoteChange}
                    placeholder="Write your notes, doubts, or key points here..."
                    style={styles.notesTextarea}
                  />
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function Section({ label, text, color, highlight }) {
  return (
    <div
      style={{
        ...styles.section,
        ...(highlight
          ? { background: `${color}10`, borderColor: `${color}40` }
          : {}),
      }}
    >
      <span style={{ ...styles.sectionLabel, color }}>{label}</span>
      <p style={styles.sectionText}>{text}</p>
    </div>
  );
}

function LoadingShimmer() {
  return (
    <div style={styles.shimmerArea}>
      {[120, 90, 70].map((h, i) => (
        <motion.div
          key={i}
          style={{ ...styles.shimmerBlock, height: h }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "48px 24px 80px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 16px",
    borderRadius: 8,
    background: "transparent",
    border: "1px solid #3a3a3a",
    color: "#9ca3af",
    fontSize: "0.88rem",
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
  },
  trackBadge: {
    padding: "6px 14px",
    borderRadius: 8,
    fontSize: "0.8rem",
    fontWeight: 600,
  },
  lessonMeta: {
    marginBottom: 32,
  },
  lessonNumber: {
    display: "block",
    fontSize: "0.78rem",
    fontWeight: 600,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  lessonTitle: {
    fontSize: "1.8rem",
    fontWeight: 700,
    color: "#ffffff",
    lineHeight: 1.3,
    margin: 0,
  },
  layout: {
    display: "flex",
    gap: 32,
    alignItems: "center",
  },
  mainContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  notesSidebar: {
    width: 260,
    flexShrink: 0,
    alignSelf: "center",
  },
  section: {
    padding: "20px 24px",
    borderRadius: 12,
    background: "#262626",
    border: "1px solid #3a3a3a",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  sectionLabel: {
    fontSize: "0.72rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  sectionText: {
    fontSize: "0.98rem",
    color: "#e5e7eb",
    lineHeight: 1.75,
    margin: 0,
  },
  actionArea: {
    marginTop: 8,
    display: "flex",
    justifyContent: "center",
  },
  completeBtn: {
    padding: "14px 48px",
    borderRadius: 10,
    border: "none",
    color: "#ffffff",
    fontWeight: 600,
    fontSize: "1rem",
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
  },
  completedBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 24px",
    borderRadius: 10,
    background: "rgba(34, 197, 94, 0.1)",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    color: "#22c55e",
    fontWeight: 600,
    fontSize: "0.95rem",
  },
  shimmerArea: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  shimmerBlock: {
    borderRadius: 12,
    background: "#262626",
  },
  errorBox: {
    padding: "24px",
    borderRadius: 12,
    border: "1px solid #3a3a3a",
    background: "#262626",
  },
  notesWrapper: {
    borderRadius: 12,
    border: "1px solid #3a3a3a",
    background: "#262626",
    overflow: "hidden",
  },
  notesToggle: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 20px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
  },
  notesToggleLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: "0.88rem",
    fontWeight: 600,
    color: "#9ca3af",
  },
  notesDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#f97316",
    display: "inline-block",
  },
  notesTextarea: {
    width: "100%",
    minHeight: 140,
    padding: "14px 20px",
    background: "#1a1a1a",
    border: "none",
    borderTop: "1px solid #3a3a3a",
    color: "#e5e7eb",
    fontSize: "0.92rem",
    lineHeight: 1.7,
    resize: "vertical",
    fontFamily: "system-ui, sans-serif",
    outline: "none",
    boxSizing: "border-box",
  },
};
