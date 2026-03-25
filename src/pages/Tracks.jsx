import { tracks } from "../data/tracks";
import TrackCard from "../components/TrackCard";
import "./Tracks.css";

export default function Tracks() {
  return (
    <div className="tracks-page">
      <div className="page-header">
        <h1>Skill Tracks</h1>
        <p>
          Six structured learning paths to take you from aspiring PM to product leader.
          Complete lessons, earn XP, and unlock the next level.
        </p>
      </div>
      <div className="tracks-grid-full">
        {tracks.map((track, i) => (
          <TrackCard key={track.id} track={track} index={i} />
        ))}
      </div>
    </div>
  );
}
