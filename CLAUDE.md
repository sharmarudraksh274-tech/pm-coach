PM Coach — Project Memory File
What This Product Is
PM Coach is a gamified AI coaching platform for aspiring Product Managers transitioning into AI PM roles. This is a case study MVP with a hard deadline. Keep all solutions simple, clean, and functional. Do not over-engineer. Do not add features not explicitly requested.
Primary Persona
Aryan Mehta — 27 year old aspiring AI Product Manager. Non-coder. AI-native. Spends 4-6 hours daily preparing. Core need: a system that tells him what to do today, shows visible progress, gives feedback, and signals when he is ready to apply.
Tech Stack
•    React + Vite
•    React Router (for navigation)
•    Framer Motion (for animations)
•    Lucide Icons (for icons)
•    localStorage ONLY for all data persistence — no external database, no API calls
Design System — Never Change These
•    Background: #1a1a1a
•    Card background: #262626
•    Primary accent: #f97316 (orange)
•    Text: #ffffff
•    Secondary text: #9ca3af
•    Success: #22c55e
•    Font: system default sans-serif
•    Border radius: 12px on cards
Navigation Structure — 5 Tabs
•    Home → / (Daily Coach Card — what to do today)
•    Learn → /learn (Role-specific learning tracks)
•    Practice → /practice (Case studies, PRD exercises, prototypes)
•    Interview → /interview (Mock questions, readiness score — unlocks at score 60+)
•    Profile → /profile (XP, level, badges, streak, progress)
Additional Routes (not in tab bar)
•    /onboarding → Onboarding page. First screen a new user sees before the quiz. Collects user's first name, saves it to localStorage under "userName", then redirects to /quiz.
•    /learn/:trackId/:lessonIndex → LessonDetail page. Shows AI-generated lesson content (Concept, Real Example, Key Takeaway) with a collapsible notes panel on the right side.
Current File Structure
•    src/pages/Home.jsx
•    src/pages/Learn.jsx (role-specific track grid, lesson buttons navigate to LessonDetail)
•    src/pages/LessonDetail.jsx (lesson content screen — AI-generated with localStorage cache, notes panel)
•    src/pages/Practice.jsx
•    src/pages/Profile.jsx
•    src/pages/RoleQuiz.jsx
•    src/pages/Onboarding.jsx
•    src/pages/Tracks.jsx (legacy, redirects to /learn)
•    src/pages/Challenges.jsx (legacy, redirects to /practice)
•    src/utils/quizScoring.js (POINT_MAP, AI_FLUENCY_MAP, QUESTION_WEIGHTS, calculateRole — kept as silent fallback)
•    src/utils/aiHelper.js (generateLesson, evaluateAnswer, generatePunchyLine, recommendRole)
•    src/utils/gameState.js (all XP, streak, track, task, readiness logic)
•    src/data/lessonData.js (TRACK_META and LESSON_TITLES for all 4 roles × 4 tracks)
•    src/App.jsx (contains all routing)
localStorage Key Map — Single Source of Truth
Every piece of user data lives here. Never create new storage keys without updating this file.
Key    Type    What It Stores
pmRole    string    Chosen PM type: "Growth PM", "AI/Data PM", "Technical PM", "Platform PM"
userName    string    User's first name
xpTotal    number    Total XP earned — starts at 0
currentLevel    string    "Beginner", "Practitioner", "Interview-Ready", "PM Candidate"
streakCount    number    Consecutive days active
lastActiveDate    string    ISO date string of last active day
completedTasks    array    Array of completed task IDs
completedTracks    array    Array of completed track IDs
weeklyProgress    number    Tasks completed this week (resets Monday)
badgesEarned    array    Array of badge IDs earned
readinessScore    number    Calculated 0-100 score
quizCompleted    boolean    True if user has completed the role quiz
weakAreas    array    Array of short skill-gap tags (e.g. "missing-metrics", "vague-structure") identified by AI evaluation across Practice challenges — merged with no duplicates after each submission
quizAnswers    object    Q1–Q6 answer arrays stored as JSON on quiz completion (e.g. { Q1: [...], Q2: [...] })
aiFluencyScore    number    Q5 AI fluency score (0–16), stored on quiz completion
lessonContent_${trackId}_${lessonIndex}    string    Claude-generated lesson text, cached permanently after first load
lessonNote_${trackId}_${lessonIndex}    string    User's freeform notes for a specific lesson, auto-saved on keystroke
XP System
Actions and XP values:
•    Complete Role Quiz: +100 XP
•    Complete a daily task: +50 XP
•    Complete a full track: +200 XP
•    3-day streak bonus: +75 XP
•    7-day streak bonus: +200 XP
•    Submit a practice PRD: +150 XP
•    Complete readiness check: +100 XP
Level thresholds:
•    Beginner: 0 – 500 XP
•    Practitioner: 501 – 1500 XP
•    Interview-Ready: 1501 – 3000 XP
•    PM Candidate: 3001+ XP
Readiness Score Formula
Calculated as:
•    Tracks completed percentage × 40
•    Daily tasks completed this week / 7 × 30
•    Streak days / 14 × 20
•    Quiz completed × 10
•    Maximum score: 100
•    Interview tab unlocks when score reaches 60
Streak Logic
•    On every app load, compare lastActiveDate to today
•    If last active was yesterday: increment streakCount by 1, update lastActiveDate
•    If last active was today: do nothing
•    If last active was 2+ days ago: reset streakCount to 1, update lastActiveDate
•    First ever visit: set streakCount to 1, set lastActiveDate to today
Edge Cases — Always Handle These
•    If pmRole is null: redirect user to /quiz before showing any content
•    If user has never visited: redirect to onboarding then /quiz
•    If user retakes quiz: clear pmRole, completedTracks, completedTasks and restart
•    If all daily tasks completed: show completion state, do not show empty card
•    Never increment streak more than once per calendar day
•    Never let XP go below 0
•    Recalculate readinessScore every time XP, streak, or completedTracks changes
Content Structure by PM Role
All content pages read pmRole from localStorage and render role-specific content.
AI/Data PM tracks: AI Product Thinking, LLM PRD Writing, No-Code Prototyping, AI Ethics and Safety
Growth PM tracks: Funnel Analysis, A/B Testing, Retention Metrics, Go-To-Market Strategy
Technical PM tracks: System Design Basics, Technical PRDs, API Thinking, Developer Experience
Platform PM tracks: API Thinking, Developer Experience, System Design Basics, Technical PRDs
Note: Consumer PM role removed. Consumer PM tracks are orphaned content — to be handled separately.
AI Content Generation
Anthropic Claude API confirmed working. Model: claude-haiku-4-5-20251001. API key stored in server/.env as ANTHROPIC_API_KEY, proxied through server/index.js.
Four functions in src/utils/aiHelper.js:
•    recommendRole(answers) — replaces static scoring. Sends all 6 quiz answers to Claude, returns { role, tagline, aiFluency }. tagline is 4–5 words reflecting the fit. Falls back to calculateRole() from quizScoring.js on API failure. Strips markdown fences before JSON.parse. Static fallback taglines per role always ensure the result screen is never blank.
•    generateLesson(topic, pmRole) — generates lesson content in CONCEPT / REAL EXAMPLE / KEY TAKEAWAY format. Called by LessonDetail.jsx. Result cached in localStorage under lessonContent_${trackId}_${lessonIndex} — never called twice for the same lesson.
•    evaluateAnswer(challenge, difficulty, userAnswer, weakAreas) — 4-criteria weighted evaluation for Practice tab. Returns structured JSON.
•    generatePunchyLine(backgrounds, role) — legacy function, kept for reference. No longer called by RoleQuiz (replaced by recommendRole tagline).
Gemini API code is removed. All AI calls go through Claude (Haiku).
Practice Tab — 4-Criteria Weighted Evaluation System
evaluateAnswer uses 4 universal criteria: Structure (logical sequence), Specificity (named methods/tools/numbers), PM Judgement (trade-offs considered), Metrics (measurable outcomes). Weights vary by difficulty:
•    Beginner: Structure 35, Specificity 30, PM Judgement 20, Metrics 15
•    Intermediate: Structure 25, Specificity 25, PM Judgement 30, Metrics 20
•    Advanced: Structure 15, Specificity 20, PM Judgement 35, Metrics 30
Pass threshold per criteria is 60% of its weight. XP earned = Math.round((totalScore / 100) * challenge.xp). Claude returns structured JSON with per-criteria scores, pass/fail, feedback, weak area tags, recurring weak area detection, and an improvement tip. Results stored in challengeResults as JSON objects (not PASS/FAIL text). weakAreas localStorage key accumulates skill-gap tags across submissions for recurring weakness tracking.
Rules Claude Must Always Follow
1.    Never change existing pages unless explicitly told to
2.    Never change colours, fonts, or navigation design
3.    Always build new features as separate files in src/pages or src/components
4.    Always use localStorage — never use external APIs or databases
5.    Always ask before installing new dependencies
6.    Keep every solution simple — this is an MVP
7.    When in doubt, do less and ask
8.    Always read this file before starting any task
9.    After completing any task, state which localStorage keys were affected
10.    Never hardcode XP, streak, or level values — always read from localStorage
Build Order
Completed:
✅ Fix state foundation — wire all localStorage keys, fix hardcoded XP and streak
✅ Update navigation to 5-tab structure
✅ Role Quiz with override
✅ Personalise Learn page by pmRole
✅ Real-time XP updates
✅ Profile page
✅ Build Daily Coach Card on Home page
✅ Quiz redesign — 6-question multi-select, 4 new roles, result screen with Claude-generated punchy line (quizScoring.js + generatePunchyLine)
✅ Quiz role recommendation — replaced static scoring with Claude AI (recommendRole). Returns best-fit role + 4–5 word fit tagline. Falls back to static algorithm silently.
✅ Fix Learn page — corrected AIPM → "AI/Data PM" key mismatch, added missing Technical PM tracks
✅ Lesson detail screen — /learn/:trackId/:lessonIndex route, LessonDetail.jsx, AI-generated content with localStorage cache, Mark as Complete awards XP
✅ Per-lesson notes — collapsible notes panel on right side of lesson screen, auto-saves to localStorage, orange dot indicator when note exists

Remaining:
1.    Onboarding page — collect userName, save to localStorage, redirect to /quiz
2.    Fix greeting to use userName from localStorage
3.    Practice page with role-specific case studies
4.    Deploy to Vercel
