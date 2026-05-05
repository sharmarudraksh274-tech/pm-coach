import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Zap,
  Flame,
  CheckCircle2,
  Circle,
  BookOpen,
  Target,
  ArrowRight,
} from "lucide-react";
import {
  getXP,
  addXP,
  getStreak,
  getLevel,
  getLevelDetails,
  getRole,
  getCompletedTasks,
} from "../utils/gameState";
import "./Home.css";

const DAILY_TASKS = {
  AIPM: [
    { id: "learn", label: "Read: How GPT-4 handles product decisions at Notion", type: "Learn", xp: 50 },
    { id: "practice", label: "Write a 1-page PRD for an AI feature of your choice", type: "Practice", xp: 50 },
    { id: "reflect", label: "Reflect: What makes a good AI product vs a bad one?", type: "Reflect", xp: 25 },
  ],
  "Growth PM": [
    { id: "learn", label: "Read: How Duolingo improved D7 retention by 20%", type: "Learn", xp: 50 },
    { id: "practice", label: "Map a funnel for an app you use daily and identify one drop-off point", type: "Practice", xp: 50 },
    { id: "reflect", label: "Reflect: What metric would you move first at an early stage startup?", type: "Reflect", xp: 25 },
  ],
  "Platform PM": [
    { id: "learn", label: "Read: How Stripe designed its API for developers", type: "Learn", xp: 50 },
    { id: "practice", label: "Write a technical PRD for a webhook notification system", type: "Practice", xp: 50 },
    { id: "reflect", label: "Reflect: What makes a platform product different from a consumer product?", type: "Reflect", xp: 25 },
  ],
  "Consumer PM": [
    { id: "learn", label: "Read: How Swiggy redesigned its checkout flow", type: "Learn", xp: 50 },
    { id: "practice", label: "Do a 10-minute teardown of any consumer app and list 3 UX improvements", type: "Practice", xp: 50 },
    { id: "reflect", label: "Reflect: Who is the primary user of your favourite app and what is their JTBD?", type: "Reflect", xp: 25 },
  ],
};

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getDailyTaskId(taskId) {
  return `daily_${getTodayKey()}_${taskId}`;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function Home() {
  const [completedToday, setCompletedToday] = useState([]);
  const [xp, setXp] = useState(getXP());
  const [streak, setStreak] = useState(getStreak());
  const role = getRole();

  // Load today's completed tasks on mount
  useEffect(() => {
    const allCompleted = getCompletedTasks();
    const todayPrefix = `daily_${getTodayKey()}_`;
    const todayDone = allCompleted
      .filter((id) => id.startsWith(todayPrefix))
      .map((id) => id.replace(todayPrefix, ""));
    setCompletedToday(todayDone);
  }, []);

  // Listen for gamestate updates
  useEffect(() => {
    const handler = () => {
      setXp(getXP());
      setStreak(getStreak());
    };
    window.addEventListener("gamestate-update", handler);
    return () => window.removeEventListener("gamestate-update", handler);
  }, []);

  function handleTaskToggle(task) {
    const fullId = getDailyTaskId(task.id);
    if (completedToday.includes(task.id)) return; // already done

    // Save to completedTasks in localStorage
    const allCompleted = getCompletedTasks();
    if (!allCompleted.includes(fullId)) {
      allCompleted.push(fullId);
      localStorage.setItem("completedTasks", JSON.stringify(allCompleted));
    }

    // Add XP
    addXP(task.xp);

    setCompletedToday((prev) => [...prev, task.id]);
  }

  // No role — show quiz banner
  if (!role) {
    return (
      <div className="home-daily">
        <motion.div
          className="quiz-banner"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Target size={40} className="quiz-banner-icon" />
          <h2>Start by taking the Role Quiz to get your personalised daily tasks</h2>
          <Link to="/quiz" className="btn-primary">
            Take the Quiz <ArrowRight size={18} />
          </Link>
        </motion.div>
      </div>
    );
  }

  const tasks = DAILY_TASKS[role] || DAILY_TASKS.AIPM;
  const levelDetails = getLevelDetails();
  const tasksCompletedToday = completedToday.length;

  return (
    <div className="home-daily">
      {/* Section 1 — Greeting */}
      <motion.section
        className="greeting-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="greeting-top">
          <div>
            <h1 className="greeting-title">{getGreeting()}, {localStorage.getItem("userName") || "PM Coach"}</h1>
            <p className="greeting-date">{formatDate()}</p>
          </div>
          <div className="stat-pills">
            <span className="stat-pill">
              <Flame size={14} /> {streak} day streak
            </span>
            <span className="stat-pill">
              <Zap size={14} /> {xp.toLocaleString()} XP
            </span>
          </div>
        </div>
      </motion.section>

      {/* Section 2 — Level progress bar */}
      <motion.section
        className="level-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <div className="level-label-row">
          <p className="level-label">
            <Zap size={16} className="level-icon" />
            {levelDetails.level}
            {levelDetails.nextLevel && (
              <span className="level-target">
                {" "}— {xp.toLocaleString()} / {levelDetails.tierMax !== null ? levelDetails.tierMax.toLocaleString() : ""} XP to {levelDetails.nextLevel}
              </span>
            )}
            {!levelDetails.nextLevel && (
              <span className="level-target"> — Max level reached!</span>
            )}
          </p>
          <span className="role-badge">{role}</span>
        </div>
        <div className="level-bar-bg">
          <motion.div
            className="level-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${levelDetails.progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </motion.section>

      {/* Section 3 — Today's Coach Card */}
      <motion.section
        className="coach-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h2 className="coach-card-title">Today's Mission</h2>
        <div className="task-list">
          {tasks.map((task) => {
            const done = completedToday.includes(task.id);
            return (
              <div
                key={task.id}
                className={`task-item ${done ? "task-done" : ""}`}
                onClick={() => !done && handleTaskToggle(task)}
              >
                <div className="task-check">
                  {done ? (
                    <CheckCircle2 size={22} className="task-icon-done" />
                  ) : (
                    <Circle size={22} className="task-icon-pending" />
                  )}
                </div>
                <div className="task-content">
                  <p className="task-label">{task.label}</p>
                  <div className="task-meta">
                    <span className="task-type">{task.type}</span>
                    <span className="task-xp">+{task.xp} XP</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* Section 4 — Progress summary */}
      <motion.section
        className="progress-summary"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div className="summary-stat">
          <span className="summary-value">{tasksCompletedToday}/3</span>
          <span className="summary-label">Tasks today</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-stat">
          <span className="summary-value">{streak}</span>
          <span className="summary-label">Day streak</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-stat">
          <span className="summary-value">{xp.toLocaleString()}</span>
          <span className="summary-label">Total XP</span>
        </div>
      </motion.section>

      {/* Section 5 — Quick links */}
      <motion.section
        className="quick-links"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Link to="/learn" className="btn-primary quick-link-btn">
          <BookOpen size={18} /> Continue Learning
        </Link>
        <Link to="/practice" className="btn-primary quick-link-btn">
          <Target size={18} /> Try a Challenge
        </Link>
      </motion.section>
    </div>
  );
}
