import { motion } from "framer-motion";
import { Zap, ChevronRight } from "lucide-react";
import "./ChallengeCard.css";

const difficultyColors = {
  Easy: "#22c55e",
  Medium: "#eab308",
  Hard: "#ef4444",
};

export default function ChallengeCard({ challenge, index }) {
  return (
    <motion.div
      className="challenge-card"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.35 }}
      whileHover={{ x: 4 }}
    >
      <div className="challenge-left">
        <div className="challenge-type-badge">{challenge.type}</div>
        <h3 className="challenge-title">{challenge.title}</h3>
        <p className="challenge-desc">{challenge.description}</p>
        <div className="challenge-meta-row">
          <span
            className="difficulty-badge"
            style={{
              color: difficultyColors[challenge.difficulty],
              background: `${difficultyColors[challenge.difficulty]}18`,
            }}
          >
            {challenge.difficulty}
          </span>
          <span className="xp-badge">
            <Zap size={14} />
            {challenge.xp} XP
          </span>
        </div>
      </div>
      <button className="challenge-start">
        <ChevronRight size={20} />
      </button>
    </motion.div>
  );
}
