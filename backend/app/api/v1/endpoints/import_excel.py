from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
import uuid
import shutil
import os
import pandas as pd

from app.infrastructure.database import get_db
from app.domain.models.import_job import ImportJob

router = APIRouter()

UPLOAD_DIR = "uploads"


@router.post("/pricing/import-excel")
def import_excel(file: UploadFile = File(...), db: Session = Depends(get_db)):
    
    os.makedirs(UPLOAD_DIR, exist_ok=True)

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
        error_rows=0  # ✅ CORRETO
    )

    db.add(job)
    db.commit()

    try:
        job.status = "processing"
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

                # 🔥 ERRO FORÇADO (TEMPORÁRIO PRA TESTE)
                #if index == 2:
                #    raise Exception("erro teste")

                print(row.to_dict())

            except Exception:
                errors += 1

            if processed % 10 == 0:
                job.processed_rows = processed
                job.error_rows = errors  # ✅ CORRETO
                db.commit()

        # finalização
        job.processed_rows = total_rows
        job.error_rows = errors  # ✅ CORRETO

        if errors > 0:
            job.status = "error"
        else:
            job.status = "done"

        db.commit()

    except Exception as e:
        job.status = "error"
        db.commit()
        print("Erro geral:", e)

    return {
        "job_id": job.id,
        "status": job.status
    }