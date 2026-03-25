import { motion } from "framer-motion";
import {
  Trophy,
  Flame,
  Target,
  BookOpen,
  Award,
  TrendingUp,
  CheckCircle,
  Lock,
} from "lucide-react";
import {
  getXP,
  getStreak,
  getLevelDetails,
  getBadges,
  getCompletedTasks,
  getCompletedTracks,
  getReadinessScore,
} from "../utils/gameState";
import "./Profile.css";

const allAchievements = [
  { id: "streak-7", icon: Flame, label: "7-Day Streak" },
  { id: "first-lesson", icon: BookOpen, label: "First Lesson" },
  { id: "strategy-starter", icon: Target, label: "Strategy Starter" },
  { id: "xp-100", icon: Trophy, label: "100 XP Club" },
  { id: "challenge-champ", icon: Award, label: "Challenge Champ" },
  { id: "top-10", icon: TrendingUp, label: "Top 10%" },
];

export default function Profile() {
  const xp = getXP();
  const streak = getStreak();
  const levelInfo = getLevelDetails();
  const badges = getBadges();
  const completedTasks = getCompletedTasks();
  const completedTracks = getCompletedTracks();
  const readiness = getReadinessScore();

  const progressLabel = levelInfo.nextLevelMin
    ? `${xp.toLocaleString()} / ${levelInfo.nextLevelMin.toLocaleString()} XP to ${levelInfo.nextLevel}`
    : `${xp.toLocaleString()} XP — Max Level`;

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>Your Profile</h1>
        <p>Track your progress, achievements, and learning journey.</p>
      </div>

      {/* Level card */}
      <motion.div
        className="level-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="level-header">
          <div className="level-avatar">
            <span>{levelInfo.tierIndex}</span>
          </div>
          <div className="level-info">
            <h2>{levelInfo.level}</h2>
            <p>{progressLabel}</p>
          </div>
        </div>
        <div className="xp-bar-bg">
          <motion.div
            className="xp-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${levelInfo.progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <div className="level-stats">
          <div className="level-stat">
            <Flame size={18} className="ls-icon" />
            <span className="ls-value">{streak}</span>
            <span className="ls-label">Day Streak</span>
          </div>
          <div className="level-stat">
            <Trophy size={18} className="ls-icon" />
            <span className="ls-value">{xp.toLocaleString()}</span>
            <span className="ls-label">Total XP</span>
          </div>
          <div className="level-stat">
            <CheckCircle size={18} className="ls-icon" />
            <span className="ls-value">{completedTasks.length}</span>
            <span className="ls-label">Tasks Done</span>
          </div>
          <div className="level-stat">
            <Target size={18} className="ls-icon" />
            <span className="ls-value">{readiness}</span>
            <span className="ls-label">Readiness</span>
          </div>
        </div>
      </motion.div>

      <div className="profile-grid">
        {/* Achievements */}
        <div className="profile-section">
          <h3>Achievements</h3>
          <div className="achievements-grid">
            {allAchievements.map((a, i) => {
              const Icon = a.icon;
              const unlocked = badges.includes(a.id);
              return (
                <motion.div
                  key={a.id}
                  className={`achievement ${unlocked ? "unlocked" : "locked"}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div className="achievement-icon">
                    {unlocked ? <Icon size={22} /> : <Lock size={18} />}
                  </div>
                  <span className="achievement-label">{a.label}</span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Stats summary */}
        <div className="profile-section">
          <h3>Progress Summary</h3>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-text">
                <span>Tracks completed</span>
              </div>
              <span className="activity-time">{completedTracks.length}</span>
            </div>
            <div className="activity-item">
              <div className="activity-text">
                <span>Tasks completed</span>
              </div>
              <span className="activity-time">{completedTasks.length}</span>
            </div>
            <div className="activity-item">
              <div className="activity-text">
                <span>Badges earned</span>
              </div>
              <span className="activity-time">{badges.length}</span>
            </div>
            <div className="activity-item">
              <div className="activity-text">
                <span>Readiness score</span>
              </div>
              <span className="activity-time">{readiness}/100</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
