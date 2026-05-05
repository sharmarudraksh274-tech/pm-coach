import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Learn from "./pages/Learn";
import Practice from "./pages/Practice";
import Profile from "./pages/Profile";
import RoleQuiz from "./pages/RoleQuiz";
import Onboarding from "./pages/Onboarding";
import LessonDetail from "./pages/LessonDetail";
import { updateStreak, recalculateReadinessScore } from "./utils/gameState";

function OnboardingGuard({ children }) {
  const location = useLocation();
  const onboardingDone = localStorage.getItem("onboardingComplete") === "true";

  if (!onboardingDone && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

function AppLayout() {
  const location = useLocation();
  const isOnboarding = location.pathname === "/onboarding";

  useEffect(() => {
    updateStreak();
    recalculateReadinessScore();
  }, []);

  return (
    <OnboardingGuard>
      {!isOnboarding && <Navbar />}
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/" element={<Home />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/learn/:trackId/:lessonIndex" element={<LessonDetail />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/interview" element={<div style={{ maxWidth: 600, margin: "0 auto", padding: "120px 24px", textAlign: "center" }}><h2 style={{ marginBottom: 8 }}>Interview Prep</h2><p style={{ color: "#9ca3af" }}>This page unlocks when your readiness score reaches 60.</p></div>} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/quiz" element={<RoleQuiz />} />
          {/* Legacy redirects */}
          <Route path="/tracks" element={<Navigate to="/learn" replace />} />
          <Route path="/challenges" element={<Navigate to="/practice" replace />} />
        </Routes>
      </main>
    </OnboardingGuard>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
