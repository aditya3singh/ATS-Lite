import os
import sys
from fastapi.testclient import TestClient

CURRENT_DIR = os.path.dirname(__file__)
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, os.pardir))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from app.main import app

if __name__ == "__main__":
    c = TestClient(app)
    print({
        "app_root": c.get("/app/").status_code,
        "ui_root": c.get("/ui/").status_code,
    })


