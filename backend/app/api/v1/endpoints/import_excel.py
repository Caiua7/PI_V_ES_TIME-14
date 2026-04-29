# Pessoa 3: Excel/Jobs

from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
import uuid
import shutil
import os

from app.infrastructure.database import get_db
from app.domain.models.import_job import ImportJob

router = APIRouter()

UPLOAD_DIR = "uploads"


@router.post("/pricing/import-excel")
def import_excel(file: UploadFile = File(...), db: Session = Depends(get_db)):
    
    # cria pasta se não existir
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # gera nome único
    file_id = str(uuid.uuid4())
    file_path = f"{UPLOAD_DIR}/{file_id}_{file.filename}"

    # salva arquivo
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # cria job no banco
    job = ImportJob(
        id=file_id,
        file_name=file.filename,
        file_path=file_path,
        status="pending"
    )

    db.add(job)
    db.commit()

    return {
        "job_id": job.id,
        "status": job.status
    }