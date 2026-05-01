from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse
import os

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
        "status": job.status,
        "total_rows": job.total_rows,
        "processed_rows": job.processed_rows,
        "error_rows": job.error_rows,
        "started_at": job.started_at,
        "finished_at": job.finished_at,
        "error_report": job.error_report_path
    }


# 🔥 NOVO ENDPOINT DE DOWNLOAD
@router.get("/{job_id}/errors/download")
def download_error_report(job_id: str, db: Session = Depends(get_db)):
    job = db.query(ImportJob).filter(ImportJob.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job não encontrado")

    if not job.error_report_path:
        raise HTTPException(status_code=404, detail="Nenhum relatório de erro disponível")

    if not os.path.exists(job.error_report_path):
        raise HTTPException(status_code=404, detail="Arquivo de erro não encontrado")

    return FileResponse(
        path=job.error_report_path,
        filename=os.path.basename(job.error_report_path),
        media_type="text/csv"
    )