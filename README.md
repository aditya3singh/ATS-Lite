# ATS-lite: Job Application Tracker

[![CI](https://github.com/aditya3singh/ATS-Lite/actions/workflows/ci.yml/badge.svg)](https://github.com/aditya3singh/ATS-Lite/actions/workflows/ci.yml)

CI runs backend static checks and E2E, plus frontend ESLint, Prettier check, and build.

Simple ATS-like system with resume upload, parsing, and matching against job descriptions using FastAPI and SQLAlchemy. The app serves a minimal static UI and an optional Vite React UI. Background tasks use FastAPI's built-in BackgroundTasks (no Celery/Redis).

## Features
- Resume upload (PDF/DOCX)
- Text parsing and basic skill extraction
- Job description management
- Resume-to-job matching score (TF‑IDF + skill overlap)
- JWT-based authentication

## Getting Started
1) Create and activate a virtual environment (Windows PowerShell)
```bash
python -m venv .venv
.\.venv\Scripts\activate
```

2) Install dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

3) Configure environment variables
Create a `.env` file in the project root:
```
DATABASE_URL=sqlite:///./ats.db
JWT_SECRET=change_me
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
STORAGE_DIR=storage
```
For Postgres instead of SQLite:
```
DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/ats
```

4) Run the API server
```bash
uvicorn app.main:app --reload
```
Open interactive docs at `http://127.0.0.1:8000/docs`.

## Frontends
### Minimal Static UI
Served from FastAPI at:
- `http://127.0.0.1:8000/app/` — Signup/login, create jobs, upload resumes, list items, and run matching.

### React UI (optional)
Served at `http://127.0.0.1:8000/ui/` after building the Vite app:
```bash
cd frontend
npm install
npm run build
```
Then run the FastAPI server and navigate to `/ui/`.

### Frontend Lint & Format
From `frontend/`:
```bash
npm run lint        # ESLint (no warnings allowed in CI)
npm run format      # Prettier check (use `format:fix` locally to write)
```

## End-to-End Check
You can run a quick E2E test against the in-process app using FastAPI's TestClient:
```bash
python scripts/e2e_test.py
```
It exercises signup/login, job creation, resume upload, parsing wait, and matching.

## Development Notes
- On first run, tables are created automatically.
- If optional NLP models are unavailable, the app falls back to a simple extractor.

## License
MIT