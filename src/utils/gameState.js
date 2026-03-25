// ---- helpers for reading/writing JSON arrays from localStorage ----
function getArray(key) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : [];
  } catch {
    return [];
  }
}

function setArray(key, arr) {
  localStorage.setItem(key, JSON.stringify(arr));
}

// ---- XP ----
export function getXP() {
  return parseInt(localStorage.getItem("xpTotal"), 10) || 0;
}

export function addXP(amount) {
  const current = getXP();
  const next = Math.max(0, current + amount);
  localStorage.setItem("xpTotal", String(next));
  syncLevel();
  syncReadinessScore();
  window.dispatchEvent(new CustomEvent("gamestate-update"));
  return next;
}

// ---- Level ----
const LEVEL_THRESHOLDS = [
  { min: 0, max: 500, label: "Beginner" },
  { min: 501, max: 1500, label: "Practitioner" },
  { min: 1501, max: 3000, label: "Interview-Ready" },
  { min: 3001, max: Infinity, label: "PM Candidate" },
];

export function getLevel() {
  const xp = getXP();
  for (const tier of LEVEL_THRESHOLDS) {
    if (xp >= tier.min && xp <= tier.max) {
      return tier.label;
    }
  }
  return "Beginner";
}

export function getLevelDetails() {
  const xp = getXP();
  const level = getLevel();
  const tierIndex = LEVEL_THRESHOLDS.findIndex((t) => t.label === level);
  const tier = LEVEL_THRESHOLDS[tierIndex];
  const nextTier = LEVEL_THRESHOLDS[tierIndex + 1];
  const xpIntoTier = xp - tier.min;
  const tierSize = tier.max === Infinity ? 1 : tier.max - tier.min + 1;
  const progress = tier.max === Infinity ? 100 : Math.min(100, (xpIntoTier / tierSize) * 100);
  return {
    level,
    tierIndex: tierIndex + 1,
    xp,
    tierMin: tier.min,
    tierMax: tier.max === Infinity ? null : tier.max,
    nextLevel: nextTier ? nextTier.label : null,
    nextLevelMin: nextTier ? nextTier.min : null,
    progress,
  };
}

function syncLevel() {
  localStorage.setItem("currentLevel", getLevel());
}

// ---- Streak ----
function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function getStreak() {
  return parseInt(localStorage.getItem("streakCount"), 10) || 0;
}

export function updateStreak() {
  const today = getToday();
  const lastActive = localStorage.getItem("lastActiveDate");

  if (!lastActive) {
    // First ever visit
    localStorage.setItem("streakCount", "1");
    localStorage.setItem("lastActiveDate", today);
    syncReadinessScore();
    window.dispatchEvent(new CustomEvent("gamestate-update"));
    return 1;
  }

  if (lastActive === today) {
    // Already active today — do nothing
    return getStreak();
  }

  if (lastActive === getYesterday()) {
    // Active yesterday — increment
    const next = getStreak() + 1;
    localStorage.setItem("streakCount", String(next));
    localStorage.setItem("lastActiveDate", today);
    syncReadinessScore();
    window.dispatchEvent(new CustomEvent("gamestate-update"));
    return next;
  }

  // 2+ days ago — reset
  localStorage.setItem("streakCount", "1");
  localStorage.setItem("lastActiveDate", today);
  syncReadinessScore();
  window.dispatchEvent(new CustomEvent("gamestate-update"));
  return 1;
}

// ---- Badges ----
export function getBadges() {
  return getArray("badgesEarned");
}

export function addBadge(badgeId) {
  const badges = getBadges();
  if (!badges.includes(badgeId)) {
    badges.push(badgeId);
    setArray("badgesEarned", badges);
  }
  return badges;
}

// ---- Tasks ----
export function getCompletedTasks() {
  return getArray("completedTasks");
}

export function markTaskComplete(taskId) {
  const tasks = getCompletedTasks();
  if (!tasks.includes(taskId)) {
    tasks.push(taskId);
    setArray("completedTasks", tasks);
    addXP(50);

    // Update weekly progress
    const weekly = getWeeklyProgress() + 1;
    localStorage.setItem("weeklyProgress", String(weekly));
  }
  syncReadinessScore();
  return tasks;
}

// ---- Tracks ----
export function getCompletedTracks() {
  return getArray("completedTracks");
}

export function markTrackComplete(trackId) {
  const tracks = getCompletedTracks();
  if (!tracks.includes(trackId)) {
    tracks.push(trackId);
    setArray("completedTracks", tracks);
    addXP(200);
  }
  syncReadinessScore();
  return tracks;
}

// ---- Weekly progress ----
export function getWeeklyProgress() {
  return parseInt(localStorage.getItem("weeklyProgress"), 10) || 0;
}

// ---- Quiz ----
export function isQuizCompleted() {
  return localStorage.getItem("quizCompleted") === "true";
}

export function getRole() {
  return localStorage.getItem("pmRole");
}

// ---- Readiness Score ----
const TOTAL_TRACKS = 4; // role-specific tracks per role

export function getReadinessScore() {
  return parseInt(localStorage.getItem("readinessScore"), 10) || 0;
}

function syncReadinessScore() {
  const tracksCompleted = getCompletedTracks().length;
  const tracksPct = Math.min(1, tracksCompleted / TOTAL_TRACKS);

  const weeklyTasks = getWeeklyProgress();
  const weeklyPct = Math.min(1, weeklyTasks / 7);

  const streak = getStreak();
  const streakPct = Math.min(1, streak / 14);

  const quizDone = isQuizCompleted() ? 1 : 0;

  const score = Math.min(
    100,
    Math.round(tracksPct * 40 + weeklyPct * 30 + streakPct * 20 + quizDone * 10)
  );

  localStorage.setItem("readinessScore", String(score));
  return score;
}

// Force a recalculation (call on app load after streak update)
export function recalculateReadinessScore() {
  return syncReadinessScore();
}

// ---- Track Progress (lesson-level) ----
// Stored as { trackId: { started: true, lessonsCompleted: [0,1,2], totalLessons: 8 } }
function getTrackProgressMap() {
  try {
    const val = localStorage.getItem("trackProgress");
    return val ? JSON.parse(val) : {};
  } catch {
    return {};
  }
}

function setTrackProgressMap(map) {
  localStorage.setItem("trackProgress", JSON.stringify(map));
}

export function getTrackProgress(trackId) {
  const map = getTrackProgressMap();
  return map[trackId] || null;
}

export function startTrack(trackId, totalLessons) {
  const map = getTrackProgressMap();
  if (!map[trackId]) {
    map[trackId] = { started: true, lessonsCompleted: [], totalLessons };
    setTrackProgressMap(map);
  }
  return map[trackId];
}

export function completeLessonInTrack(trackId, lessonIndex) {
  const map = getTrackProgressMap();
  if (!map[trackId]) return null;
  const progress = map[trackId];
  if (!progress.lessonsCompleted.includes(lessonIndex)) {
    progress.lessonsCompleted.push(lessonIndex);
    setTrackProgressMap(map);

    // +50 XP for each individual lesson
    addXP(50);

    // If all lessons done, mark track complete (awards additional 200 XP bonus)
    if (progress.lessonsCompleted.length >= progress.totalLessons) {
      markTrackComplete(trackId);
    }
  }
  return progress;
}
