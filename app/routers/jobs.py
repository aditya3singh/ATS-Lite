from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
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
def list_jobs(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    q = db.query(Job).order_by(Job.id.desc()).offset(max(skip, 0)).limit(max(min(limit, 100), 1))
    return q.all()


@router.put("/{job_id}", response_model=JobOut)
def update_job(job_id: int, payload: JobCreate, db: Session = Depends(get_db)):
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.title = payload.title
    job.description = payload.description
    job.skills = payload.skills
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.delete("/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(job)
    db.commit()
    return {"ok": True}


