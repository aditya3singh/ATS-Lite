from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Job
from ..schemas import JobCreate, JobOut
from ..utils.security import get_current_user


router = APIRouter(dependencies=[Depends(get_current_user)])


@router.post("/", response_model=JobOut)
def create_job(payload: JobCreate, db: Session = Depends(get_db)):
    job = Job(title=payload.title, description=payload.description, skills=payload.skills)
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.get("/", response_model=list[JobOut])
def list_jobs(db: Session = Depends(get_db)):
    return db.query(Job).order_by(Job.id.desc()).all()


