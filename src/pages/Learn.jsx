import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen,
  Star,
  Brain,
  FileText,
  Blocks,
  ShieldCheck,
  BarChart3,
  FlaskConical,
  TrendingUp,
  Rocket,
  Plug,
  Users,
  Compass,
  Lightbulb,
  Layout,
  PieChart,
  ArrowRight,
  CheckCircle,
  Play,
} from "lucide-react";
import {
  getRole,
  getCompletedTracks,
  getTrackProgress,
  startTrack,
} from "../utils/gameState";
import "../components/TrackCard.css";
import "./Learn.css";

const roleTrackMap = {
  "AI/Data PM": [
    {
      id: "aipm-1",
      title: "AI Product Thinking",
      description: "Learn to identify AI-solvable problems and define product value around LLM capabilities.",
      icon: Brain,
      color: "#f97316",
      lessons: 8,
      xp: 400,
    },
    {
      id: "aipm-2",
      title: "LLM and PRD Writing",
      description: "Write product requirement docs for AI features — prompts, evals, and success metrics.",
      icon: FileText,
      color: "#8b5cf6",
      lessons: 6,
      xp: 300,
    },
    {
      id: "aipm-3",
      title: "No-Code Prototyping with Lovable",
      description: "Build functional AI prototypes without writing code using no-code and low-code tools.",
      icon: Blocks,
      color: "#06b6d4",
      lessons: 5,
      xp: 250,
    },
    {
      id: "aipm-4",
      title: "AI Ethics and Safety",
      description: "Understand responsible AI principles — bias, safety, transparency, and governance.",
      icon: ShieldCheck,
      color: "#22c55e",
      lessons: 4,
      xp: 200,
    },
  ],
  "Growth PM": [
    {
      id: "growth-1",
      title: "Funnel Analysis",
      description: "Map and optimise user funnels from acquisition to activation to retention.",
      icon: BarChart3,
      color: "#f97316",
      lessons: 8,
      xp: 400,
    },
    {
      id: "growth-2",
      title: "A/B Testing and Experimentation",
      description: "Design, run, and analyse experiments that drive measurable product growth.",
      icon: FlaskConical,
      color: "#8b5cf6",
      lessons: 6,
      xp: 300,
    },
    {
      id: "growth-3",
      title: "Retention Metrics",
      description: "Understand cohort analysis, churn prediction, and engagement scoring.",
      icon: TrendingUp,
      color: "#06b6d4",
      lessons: 5,
      xp: 250,
    },
    {
      id: "growth-4",
      title: "Go-To-Market Strategy",
      description: "Plan and execute product launches that reach the right users at the right time.",
      icon: Rocket,
      color: "#22c55e",
      lessons: 4,
      xp: 200,
    },
  ],
  "Technical PM": [
    {
      id: "tech-1",
      title: "System Design Basics",
      description: "Understand distributed systems, scalability, and infrastructure trade-offs a PM must know.",
      icon: Compass,
      color: "#f97316",
      lessons: 8,
      xp: 400,
    },
    {
      id: "tech-2",
      title: "Technical PRD Writing",
      description: "Write PRDs that engineering teams can execute — architecture, specs, and timelines.",
      icon: FileText,
      color: "#8b5cf6",
      lessons: 6,
      xp: 300,
    },
    {
      id: "tech-3",
      title: "API Thinking",
      description: "Design APIs that developers love — RESTful patterns, contracts, and versioning.",
      icon: Plug,
      color: "#06b6d4",
      lessons: 5,
      xp: 250,
    },
    {
      id: "tech-4",
      title: "Developer Experience",
      description: "Build technical products with great DX — docs, SDKs, onboarding, and tooling.",
      icon: Users,
      color: "#22c55e",
      lessons: 4,
      xp: 200,
    },
  ],
  "Platform PM": [
    {
      id: "platform-1",
      title: "API Thinking and Integration",
      description: "Design APIs that developers love — RESTful patterns, contracts, and versioning.",
      icon: Plug,
      color: "#f97316",
      lessons: 8,
      xp: 400,
    },
    {
      id: "platform-2",
      title: "Developer Experience",
      description: "Build platform products with great DX — docs, SDKs, onboarding, and support.",
      icon: Users,
      color: "#8b5cf6",
      lessons: 6,
      xp: 300,
    },
    {
      id: "platform-3",
      title: "System Design Basics",
      description: "Understand distributed systems, scalability, and infrastructure trade-offs.",
      icon: Compass,
      color: "#06b6d4",
      lessons: 5,
      xp: 250,
    },
    {
      id: "platform-4",
      title: "Technical PRD Writing",
      description: "Write PRDs that engineering teams can execute — architecture, specs, and timelines.",
      icon: FileText,
      color: "#22c55e",
      lessons: 4,
      xp: 200,
    },
  ],
  "Consumer PM": [
    {
      id: "consumer-1",
      title: "User Research Methods",
      description: "Master interviews, surveys, usability tests, and ethnographic research techniques.",
      icon: Lightbulb,
      color: "#f97316",
      lessons: 8,
      xp: 400,
    },
    {
      id: "consumer-2",
      title: "Product Sense Training",
      description: "Develop intuition for what makes consumer products compelling and sticky.",
      icon: Layout,
      color: "#8b5cf6",
      lessons: 6,
      xp: 300,
    },
    {
      id: "consumer-3",
      title: "UX Fundamentals",
      description: "Learn core UX principles — information architecture, flows, and design critique.",
      icon: Compass,
      color: "#06b6d4",
      lessons: 5,
      xp: 250,
    },
    {
      id: "consumer-4",
      title: "Consumer Metrics",
      description: "Track DAU, engagement, NPS, and the metrics that define consumer product success.",
      icon: PieChart,
      color: "#22c55e",
      lessons: 4,
      xp: 200,
    },
  ],
};

export default function Learn() {
  const role = getRole();
  const navigate = useNavigate();
  const [, setRefresh] = useState(0);
  const [expandedTracks, setExpandedTracks] = useState([]);
  const forceRefresh = () => setRefresh((n) => n + 1);

  if (!role) {
    return (
      <div className="learn-page">
        <div className="learn-empty">
          <h2>You haven't taken the role quiz yet</h2>
          <p>Complete the quiz so we can personalise your learning path.</p>
          <Link to="/quiz" className="learn-cta-btn">
            Take the Quiz <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  const tracks = roleTrackMap[role] || [];
  const completedTracks = getCompletedTracks();

  const handleStartTrack = (trackId, totalLessons) => {
    startTrack(trackId, totalLessons);
    setExpandedTracks((prev) => [...prev, trackId]);
    forceRefresh();
  };

  return (
    <div className="learn-page">
      <div className="page-header">
        <h1>Your Learning Path</h1>
        <p>Personalised tracks for your {role} journey. Complete all lessons to earn XP.</p>
      </div>
      <div className="learn-grid">
        {tracks.map((track, i) => {
          const progress = getTrackProgress(track.id);
          const isComplete = completedTracks.includes(track.id);
          const isExpanded = expandedTracks.includes(track.id);
          const lessonsCompleted = progress ? progress.lessonsCompleted.length : 0;
          const Icon = track.icon;

          return (
            <motion.div
              key={track.id}
              className="track-card"
              style={{ background: "#262626", borderRadius: "12px" }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              whileHover={{ y: -4 }}
            >
              <div className="track-card-accent" style={{ background: track.color }} />
              <div className="track-card-body">
                <div
                  className="track-icon"
                  style={{ background: `${track.color}20`, color: track.color }}
                >
                  <Icon size={24} />
                </div>
                <h3 className="track-title">{track.title}</h3>
                <p className="track-desc">{track.description}</p>

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

                {isComplete ? (
                  <button className="track-complete-badge" disabled>
                    <CheckCircle size={16} />
                    Completed — XP earned
                  </button>
                ) : isExpanded ? (
                  <div className="track-progress-section">
                    <div className="track-progress-bar-bg">
                      <div
                        className="track-progress-bar-fill"
                        style={{
                          width: `${(lessonsCompleted / track.lessons) * 100}%`,
                          background: track.color,
                        }}
                      />
                    </div>
                    <span className="track-progress-label">
                      {lessonsCompleted} / {track.lessons} lessons
                    </span>
                    <div className="track-lessons-list">
                      {Array.from({ length: track.lessons }).map((_, li) => {
                        const done = progress.lessonsCompleted.includes(li);
                        return (
                          <button
                            key={li}
                            className={`lesson-btn ${done ? "done" : ""}`}
                            onClick={() => navigate(`/learn/${track.id}/${li}`)}
                          >
                            {done ? (
                              <CheckCircle size={14} />
                            ) : (
                              <Play size={14} />
                            )}
                            Lesson {li + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <button
                    className="track-btn"
                    style={{ background: track.color }}
                    onClick={() => handleStartTrack(track.id, track.lessons)}
                  >
                    Start Track
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
