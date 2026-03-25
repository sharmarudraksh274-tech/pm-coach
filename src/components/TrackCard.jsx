import { motion } from "framer-motion";
import { BookOpen, Star } from "lucide-react";
import "./TrackCard.css";

export default function TrackCard({ track, index }) {
  const Icon = track.icon;

  return (
    <motion.div
      className="track-card"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ y: -4 }}
    >
      <div
        className="track-card-accent"
        style={{ background: track.color }}
      />
      <div className="track-card-body">
        <div className="track-icon" style={{ background: `${track.color}20`, color: track.color }}>
          <Icon size={24} />
        </div>
        <h3 className="track-title">{track.title}</h3>
        <p className="track-desc">{track.description}</p>

        <div className="track-modules">
          {track.modules.map((mod) => (
            <span key={mod} className="module-tag">{mod}</span>
          ))}
        </div>

        <div className="track-footer">
          <div className="track-meta">
            <BookOpen size={14} />
            <span>{track.lessons} lessons</span>
          </div>
          <div className="track-meta">
            <Star size={14} />
            <span>{track.xp} XP</span>
          </div>
        </div>

        <button className="track-btn" style={{ background: track.color }}>
          Start Learning
        </button>
      </div>
    </motion.div>
  );
}
