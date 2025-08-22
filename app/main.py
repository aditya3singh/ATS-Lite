from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import RedirectResponse
import os

from .config import get_settings
from .database import Base, engine


settings = get_settings()

app = FastAPI(title="ATS-lite", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)

app.mount("/app", StaticFiles(directory="app/frontend", html=True), name="frontend")
if os.path.isdir("frontend/dist"):
    app.mount("/ui", StaticFiles(directory="frontend/dist", html=True), name="react-ui")

# Ensure /ui (no trailing slash) loads correctly
@app.get("/ui")
def _ui_redirect() -> RedirectResponse:
    return RedirectResponse(url="/ui/")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


from .routers import auth, jobs, resumes, matching

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
app.include_router(resumes.router, prefix="/resumes", tags=["resumes"])
app.include_router(matching.router, prefix="/matching", tags=["matching"])

