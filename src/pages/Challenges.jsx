import { challengeData } from "../data/tracks";
import ChallengeCard from "../components/ChallengeCard";
import "./Challenges.css";

export default function Challenges() {
  return (
    <div className="challenges-page">
      <div className="page-header">
        <h1>Challenges</h1>
        <p>
          Put your PM skills to the test with real-world scenarios, quizzes, and
          interactive simulations. Earn bonus XP for every challenge you complete.
        </p>
      </div>
      <div className="challenges-list">
        {challengeData.map((challenge, i) => (
          <ChallengeCard key={challenge.id} challenge={challenge} index={i} />
        ))}
      </div>
    </div>
  );
}
