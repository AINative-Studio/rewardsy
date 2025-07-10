Below is a tightly time‐boxed, agile-inspired “1-hour sprint” plan to get the core MVP up and running. You can run this solo or assign minute pairs to teammates if you have help.

| Time      | Phase                          | Goals                                       | Tasks                                                                                                                                                             | Definition of Done                                     |
| --------- | ------------------------------ | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 0–5 min   | 🚀 Kickoff & Planning          | Align on scope and runtime environment      | - Quick review of PRD & data model<br>- Decide tech stack (e.g. React Native + FastAPI)<br>- Create repo & branches                                               | Repo initialized, scope pinned, stack decided          |
| 5–15 min  | 🔧 Environment Setup           | Get dev loop running                        | - Scaffold frontend (create-react-app or Expo project)<br>- Scaffold backend (FastAPI project template)<br>- Install core dependencies (DB client, HTTP client)   | “Hello World” served on both front & back              |
| 15–25 min | 🗄️  Backend Core APIs         | Expose task & reward CRUD                   | - Define ORM models for User, Task, Reward<br>- Implement `/tasks` POST/GET endpoints<br>- Implement `/tasks/{id}/complete` to log TaskHistory & decrement budget | Can create, list, and complete a task via HTTP         |
| 25–35 min | 🎨 Frontend MVP UI             | Display task list & “complete” button       | - Create TaskList screen<br>- Fetch from `/tasks`<br>- Render items with title, reward badge, “Complete” action                                                   | Tasks load, display correctly, “Complete” triggers API |
| 35–45 min | 🤖 AI Suggestions & Scheduling | Hook in a stubbed AI endpoint               | - Add `/ai/suggest-reward` endpoint returning a hard-coded reward suggestion<br>- On “Add Task,” call AI endpoint to prefill reward field                         | Creating a task shows suggested reward                 |
| 45–55 min | ✅ Polish & Edge Flows          | Handle basic error & UX flows               | - Show loading spinners & error messages<br>- Prompt to claim reward after completion<br>- Simple local form validation                                           | No uncaught errors; basic UX feedback in place         |
| 55–60 min | 📣 Demo & Retrospective        | Verify success criteria & capture learnings | - Run through user flow: Add → AI suggests reward → Complete → Reward prompt<br>- Note biggest risks or next-steps                                                | App demo works end-to-end; list of post-hack tasks     |

**Tips for success:**

* **Keep it MVP-first:** Hardcode or stub noncritical pieces (e.g. AI suggestions) and iterate only if time remains.
* **Automate repetition:** Use hot-reload and mock data where possible.
* **Demo readability:** Keep your UI minimal—clear text labels over fancy styling.
* **Focus on flow:** The core loop (add task → AI reward → complete → claim reward) is your North Star.
