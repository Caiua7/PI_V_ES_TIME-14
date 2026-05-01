from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
import uuid
import shutil
import os
import pandas as pd
from datetime import datetime  # 🔥 IMPORTANTE
import time

from app.infrastructure.database import get_db
from app.domain.models.import_job import ImportJob

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
        error_rows=0
    )

    db.add(job)
    db.commit()

    try:
        # 🔥 INÍCIO DO PROCESSAMENTO
        job.status = "processing"
        job.started_at = datetime.utcnow().replace(microsecond=0)
        db.commit()

        df = pd.read_excel(file_path)

        total_rows = len(df)
        job.total_rows = total_rows
        db.commit()

        print(f"Total de linhas: {total_rows}")

        processed = 0
        errors = 0

        for index, row in df.iterrows():
            try:
                processed += 1
                print(row.to_dict())

            except Exception:
                errors += 1

            if processed % 10 == 0:
                job.processed_rows = processed
                job.error_rows = errors
                db.commit()

        # 🔥 FINALIZAÇÃO
        job.processed_rows = total_rows
        job.error_rows = errors

        if errors > 0:
            job.status = "error"
        else:
            job.status = "done"

        job.finished_at = datetime.utcnow().replace(microsecond=0)
        db.commit()

    except Exception as e:
        job.status = "error"
        job.finished_at = datetime.utcnow().replace(microsecond=0)
        db.commit()
        print("Erro geral:", e)

    return {
        "job_id": job.id,
        "status": job.status
    }