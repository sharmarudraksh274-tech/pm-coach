import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Flame, Trophy, Zap, Lock } from "lucide-react";
import { getXP, getStreak, getReadinessScore } from "../utils/gameState";
import "./Navbar.css";

export default function Navbar() {
  const location = useLocation();
  const [xp, setXp] = useState(getXP());
  const [streak, setStreak] = useState(getStreak());
  const [readiness, setReadiness] = useState(getReadinessScore());

  useEffect(() => {
    setXp(getXP());
    setStreak(getStreak());
    setReadiness(getReadinessScore());
  }, [location.pathname]);

  useEffect(() => {
    const handleUpdate = () => {
      setXp(getXP());
      setStreak(getStreak());
      setReadiness(getReadinessScore());
    };
    window.addEventListener("gamestate-update", handleUpdate);
    return () => window.removeEventListener("gamestate-update", handleUpdate);
  }, []);

  const interviewLocked = readiness < 60;

  const links = [
    { to: "/", label: "Home" },
    { to: "/learn", label: "Learn" },
    { to: "/practice", label: "Practice" },
    { to: "/interview", label: "Interview", locked: interviewLocked },
    { to: "/profile", label: "Profile" },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <Zap size={24} className="brand-icon" />
          <span>PM Coach</span>
        </Link>

        <div className="navbar-links">
          {links.map((link) => {
            if (link.locked) {
              return (
                <span
                  key={link.to}
                  className="nav-link locked"
                  title="Reach a readiness score of 60 to unlock"
                >
                  <Lock size={13} />
                  {link.label}
                </span>
              );
            }
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`nav-link ${location.pathname === link.to ? "active" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="navbar-stats">
          <div className="stat-badge">
            <Flame size={16} className="stat-icon streak" />
            <span>{streak}</span>
          </div>
          <div className="stat-badge">
            <Trophy size={16} className="stat-icon xp" />
            <span>{xp.toLocaleString()} XP</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
