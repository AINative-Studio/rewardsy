# Rewardsy

**AI-Powered Rewarded To-Do List**

---

## Overview
Rewardsy is a productivity platform that motivates users to complete tasks through personalized, AI-powered rewards. Built with a secure, scalable backend and a modern frontend, Rewardsy integrates with ZeroDB for advanced data management and AI features.

---

## Backend Architecture
- **Framework:** FastAPI (Python, async)
- **Database:** ZeroDB (primary, async NoSQL with vector search); SQLAlchemy/SQLite for local dev
- **ORM:** SQLAlchemy (legacy, for dev/testing)
- **Auth:** JWT tokens, secure password hashing (bcrypt via passlib)
- **AI:** Reward suggestions via vector embeddings and RLHF logging
- **Testing:** Pytest (BDD-style and standard)
- **Other:** CORS, Pydantic for validation, modular code structure

---

## Key Features
- Secure user authentication (signup, login, JWT)
- Task CRUD (create, read, update, delete)
- Reward management and AI-powered suggestions
- User activity feed and analytics
- File uploads for reward attachments
- ZeroDB async integration for all core operations
- BDD/TDD test suite

---

## Setup Instructions

### Prerequisites
- Python 3.9+
- [ZeroDB credentials](https://zerodb.ai/) (API key, project ID)

### Installation
```bash
pip install -r rewardsy_backend/requirements.txt
```

### Environment Variables
Create a `.env` file or set the following:
- `ZERODB_API_KEY`
- `ZERODB_PROJECT_ID`
- `ZERODB_API_BASE_URL` (optional, defaults to public endpoint)
- `JWT_SECRET_KEY` (for production)

### Running the Backend
```bash
uvicorn rewardsy_backend.main:app --reload
```

---

## API Endpoints (Sample)
- `POST /signup` — Register a new user
- `POST /login` — Authenticate and receive JWT
- `GET /tasks` — List all tasks
- `POST /tasks` — Create a new task
- `PUT /tasks/{task_id}` — Update a task
- `DELETE /tasks/{task_id}` — Delete a task
- `GET /user/activity` — User activity feed
- `POST /rewards/suggest` — AI reward suggestions

See `main.py` for full OpenAPI schema.

---

## Testing & Contribution
- **Test:**
  ```bash
  pytest rewardsy_backend/tests/
  ```
- **Coding Standards:**
  - 4-space indentation, line length < 80 chars
  - camelCase for variables/functions, PascalCase for classes
  - BDD-style tests preferred
  - Use meaningful comments, keep code modular
- **Branching:**
  - `feature/{id}` for features, `bug/{id}` for fixes, `chore/{id}` for maintenance

---

## Security & Best Practices
- All secrets in environment variables (never hardcoded)
- Passwords hashed with bcrypt
- JWT secret must be unique and strong in production
- CORS restricted to trusted origins

---

## License
MIT
