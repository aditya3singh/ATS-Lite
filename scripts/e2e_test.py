from __future__ import annotations

import os
import sys
import time
import uuid

# Ensure project root is on sys.path so `app` is importable when running this script directly
CURRENT_DIR = os.path.dirname(__file__)
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, os.pardir))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastapi.testclient import TestClient

from app.main import app


def run_e2e() -> dict:
    with TestClient(app) as client:
        # health
        r = client.get("/health")
        assert r.status_code == 200

        # signup
        email = f"tester_{uuid.uuid4().hex[:8]}@example.com"
        password = "secret12"
        r = client.post(
            "/auth/signup",
            json={"email": email, "password": password, "full_name": "Tester"},
        )
        assert r.status_code == 200, r.text

        # login
        r = client.post("/auth/login", json={"email": email, "password": password})
        assert r.status_code == 200, r.text
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # create job
        r = client.post(
            "/jobs/",
            headers=headers,
            json={
                "title": "Data Scientist",
                "description": "Python ML NLP SQL",
                "skills": ["python", "ml", "nlp", "sql"],
            },
        )
        assert r.status_code == 200, r.text
        job_id = r.json()["id"]

        # upload resume
        files = {"file": ("resume.txt", b"Experienced in Python, ML, NLP, SQL and FastAPI.", "text/plain")}
        r = client.post("/resumes/", headers=headers, files=files)
        assert r.status_code == 200, r.text
        resume_id = r.json()["id"]

        # wait for parsing
        parsed = False
        for _ in range(100):
            r = client.get("/resumes/", headers=headers)
            assert r.status_code == 200
            resumes = r.json()
            target = next((x for x in resumes if x["id"] == resume_id), None)
            if target and target["parsed"]:
                parsed = True
                break
            time.sleep(0.1)

        # match
        r = client.get(f"/matching/resume/{resume_id}/job/{job_id}", headers=headers)
        assert r.status_code == 200, r.text
        score = r.json()["score"]

        return {"token_len": len(token), "job_id": job_id, "resume_id": resume_id, "parsed": parsed, "score": score}


if __name__ == "__main__":
    result = run_e2e()
    print(result)


