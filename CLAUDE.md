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
Current File Structure
•    src/pages/Home.jsx
•    src/pages/Tracks.jsx (to be renamed Learn.jsx)
•    src/pages/Challenges.jsx (to be renamed Practice.jsx)
•    src/pages/Profile.jsx
•    src/pages/RoleQuiz.jsx
•    src/App.jsx (contains all routing)
localStorage Key Map — Single Source of Truth
Every piece of user data lives here. Never create new storage keys without updating this file.
Key    Type    What It Stores
pmRole    string    Chosen PM type: "AIPM", "Growth PM", "Platform PM", "Consumer PM"
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
AIPM tracks: AI Product Thinking, LLM PRD Writing, No-Code Prototyping, AI Ethics and Safety Growth PM tracks: Funnel Analysis, A/B Testing, Retention Metrics, Go-To-Market Strategy Platform PM tracks: API Thinking, Developer Experience, System Design Basics, Technical PRDs Consumer PM tracks: User Research, Product Sense, UX Fundamentals, Consumer Metrics
AI Content Generation
AI content generation via Gemini API is built in src/utils/aiHelper.js but disabled for MVP demo due to quota limits. Post-MVP: enable billing and connect Learn lessons and Practice challenges to live AI generation.
Anthropic Claude API confirmed working. Model: claude-haiku-4-5-20251001. Two functions in src/utils/aiHelper.js: generateLesson(topic, pmRole) and evaluateAnswer(challenge, difficulty, userAnswer, weakAreas). API key stored in .env as VITE_ANTHROPIC_API_KEY.
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

Remaining:
1.    Onboarding page — collect userName, save to localStorage, redirect to /quiz
2.    Fix Learn page lesson expansion bug
3.    Fix greeting to use userName from localStorage
4.    Practice page with role-specific case studies
5.    Deploy to Vercel
