from app.core.celery_app import celery_app
from app.infrastructure.database import SessionLocal
from app.domain.models.import_job import ImportJob
from datetime import datetime
import pandas as pd

@celery_app.task
def process_excel(job_id: str):
    print("🔥 TASK INICIADA", job_id)

    db = SessionLocal()

    try:
        job = db.query(ImportJob).filter(ImportJob.id == job_id).first()

        if not job:
            print("❌ Job não encontrado")
            return

        # INÍCIO
        job.status = "processing"
        job.started_at = datetime.utcnow().replace(microsecond=0)
        db.commit()

        print("Lendo Excel...")
        df = pd.read_excel(job.file_path)

        total = len(df)
        job.total_rows = total
        db.commit()

        processed = 0
        errors = 0

        for _, row in df.iterrows():
            try:
                processed += 1
                print(row.to_dict())
            except Exception:
                errors += 1

        # FINALIZAÇÃO
        job.processed_rows = total
        job.error_rows = errors

        if errors > 0:
            job.status = "error"
        else:
            job.status = "done"

        job.finished_at = datetime.utcnow().replace(microsecond=0)
        db.commit()

        print("PROCESSAMENTO FINALIZADO")

    except Exception as e:
        print("ERRO:", str(e))

        job.status = "error"
        job.finished_at = datetime.utcnow().replace(microsecond=0)
        db.commit()

    finally:
        db.close()