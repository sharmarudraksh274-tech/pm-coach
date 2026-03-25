import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

export default function Onboarding() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name to continue");
      return;
    }
    localStorage.setItem("userName", trimmed);
    localStorage.setItem("onboardingComplete", "true");
    navigate("/quiz");
  };

  return (
    <div style={styles.wrapper}>
      <motion.div
        style={styles.container}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div style={styles.logoCircle}>
          <Zap size={36} color="#f97316" />
        </div>

        <h1 style={styles.heading}>Welcome to PM Coach</h1>
        <p style={styles.subheading}>
          Your personalised AI PM coaching journey starts here
        </p>

        <input
          type="text"
          placeholder="What should we call you?"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          style={styles.input}
          onFocus={(e) => (e.target.style.borderColor = "#f97316")}
          onBlur={(e) => (e.target.style.borderColor = "#3a3a3a")}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.button} onClick={handleSubmit}>
          Let's Go →
        </button>
      </motion.div>
    </div>
  );
}

const styles = {
  wrapper: {
    position: "fixed",
    inset: 0,
    background: "#1a1a1a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  container: {
    textAlign: "center",
    padding: "40px 32px",
    maxWidth: 420,
    width: "100%",
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "rgba(249, 115, 22, 0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 28px",
  },
  heading: {
    fontSize: "2rem",
    fontWeight: 800,
    color: "#ffffff",
    marginBottom: 8,
  },
  subheading: {
    fontSize: "1rem",
    color: "#9ca3af",
    marginBottom: 32,
    lineHeight: 1.5,
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 12,
    border: "2px solid #3a3a3a",
    background: "#262626",
    color: "#ffffff",
    fontSize: "1rem",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  error: {
    color: "#ef4444",
    fontSize: "0.85rem",
    marginTop: 8,
    marginBottom: 0,
  },
  button: {
    width: "100%",
    padding: "14px",
    borderRadius: 12,
    background: "#f97316",
    color: "#ffffff",
    fontSize: "1rem",
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
    marginTop: 20,
    transition: "background 0.2s",
  },
};
