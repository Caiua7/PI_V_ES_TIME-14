from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
import uuid
import shutil
import os
from datetime import datetime
import time

from app.infrastructure.database import get_db
from app.domain.models.import_job import ImportJob
from app.tasks.import_tasks import process_excel  # 🔥 NOVO

router = APIRouter()

UPLOAD_DIR = "uploads"


def cleanup_old_files(directory, max_age_seconds=86400):
    now = time.time()

    for filename in os.listdir(directory):
        file_path = os.path.join(directory, filename)

        if os.path.isfile(file_path):
            file_age = now - os.path.getmtime(file_path)

            if file_age > max_age_seconds:
                os.remove(file_path)
                print(f"Removido arquivo antigo: {filename}")


@router.post("/pricing/import-excel")
def import_excel(file: UploadFile = File(...), db: Session = Depends(get_db)):

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    cleanup_old_files(UPLOAD_DIR)

    # 🔥 IDPOTÊNCIA
    existing_job = db.query(ImportJob).filter(
        ImportJob.file_name == file.filename
    ).first()

    if existing_job:
        return {
            "job_id": existing_job.id,
            "status": existing_job.status,
            "message": "Arquivo já importado anteriormente"
        }

    file_id = str(uuid.uuid4())
    file_path = f"{UPLOAD_DIR}/{file_id}_{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    job = ImportJob(
        id=file_id,
        file_name=file.filename,
        file_path=file_path,
        status="pending",
        total_rows=0,
        processed_rows=0,
        error_rows=0,
        started_at=None,
        finished_at=None
    )

    db.add(job)
    db.commit()

    # 🔥 ENVIA PARA O CELERY
    process_excel.delay(job.id)

    return {
        "job_id": job.id,
        "status": "pending"
    }