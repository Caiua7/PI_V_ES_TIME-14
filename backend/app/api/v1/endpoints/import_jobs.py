from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.infrastructure.database import get_db
from app.domain.models.import_job import ImportJob

router = APIRouter()


@router.get("/{job_id}")
def get_job_status(job_id: str, db: Session = Depends(get_db)):
    job = db.query(ImportJob).filter(ImportJob.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job não encontrado")

    return {
        "id": job.id,
        "status": job.status
    }