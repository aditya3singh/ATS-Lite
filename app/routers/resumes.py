from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Resume
from ..schemas import ResumeOut
from ..utils.file_storage import save_upload
from ..utils.security import get_current_user
from ..services.resume_service import extract_text_and_skills


router = APIRouter(dependencies=[Depends(get_current_user)])


def _parse_resume_background(resume_id: int, path: str, db: Session) -> None:
    text, skills = extract_text_and_skills(path)
    resume = db.get(Resume, resume_id)
    if resume is None:
        return
    resume.content_text = text
    resume.skills = skills
    resume.parsed = True
    db.add(resume)
    db.commit()


@router.post("/", response_model=ResumeOut)
def upload_resume(background_tasks: BackgroundTasks, file: UploadFile = File(...), db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename required")
    saved_name, path = save_upload(file)
    resume = Resume(user_id=user.id, filename=saved_name, parsed=False)
    db.add(resume)
    db.commit()
    db.refresh(resume)

    # Run background parsing using a fresh session inside the task
    def task(resume_id: int, path: str) -> None:
        # Get a new session to avoid cross-thread issues
        from ..database import SessionLocal

        local_db = SessionLocal()
        try:
            _parse_resume_background(resume_id, path, local_db)
        finally:
            local_db.close()

    background_tasks.add_task(task, resume.id, path)

    return resume


@router.get("/", response_model=list[ResumeOut])
def list_resumes(skip: int = 0, limit: int = 20, db: Session = Depends(get_db), user=Depends(get_current_user)):
    q = (
        db.query(Resume)
        .filter(Resume.user_id == user.id)
        .order_by(Resume.id.desc())
        .offset(max(skip, 0))
        .limit(max(min(limit, 100), 1))
    )
    return q.all()


@router.delete("/{resume_id}")
def delete_resume(resume_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    resume = db.get(Resume, resume_id)
    if not resume or resume.user_id != user.id:
        raise HTTPException(status_code=404, detail="Resume not found")
    db.delete(resume)
    db.commit()
    return {"ok": True}


