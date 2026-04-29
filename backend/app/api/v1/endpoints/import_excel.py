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
    
    # cria pasta se não existir
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # 🔥 IDPOTÊNCIA (ANTES DE QUALQUER PROCESSAMENTO)
    existing_job = db.query(ImportJob).filter(
        ImportJob.file_name == file.filename
    ).first()

    if existing_job:
        return {
            "job_id": existing_job.id,
            "status": existing_job.status,
            "message": "Arquivo já importado anteriormente"
        }

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
        status="pending",
        total_rows=0,
        processed_rows=0
    )

    db.add(job)
    db.commit()

    # 🔥 INÍCIO DO PROCESSAMENTO
    try:
        job.status = "processing"
        db.commit()

        df = pd.read_excel(file_path)

        total_rows = len(df)
        job.total_rows = total_rows
        db.commit()

        print(f"Total de linhas: {total_rows}")

        processed = 0

        for index, row in df.iterrows():
            processed += 1

            print(row.to_dict())

            # atualiza progresso a cada 10 linhas
            if processed % 10 == 0:
                job.processed_rows = processed
                db.commit()
                print(f"Processado: {processed}/{total_rows}")

        # finalização
        job.processed_rows = total_rows
        job.status = "done"
        db.commit()

    except Exception as e:
        job.status = "error"
        db.commit()
        print("Erro ao processar:", e)

    return {
        "job_id": job.id,
        "status": job.status
    }