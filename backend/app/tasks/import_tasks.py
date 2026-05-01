from app.core.celery_app import celery_app
from app.infrastructure.database import SessionLocal
from app.domain.models.import_job import ImportJob
import pandas as pd

@celery_app.task
def process_excel(job_id: str):
    db = SessionLocal()

    job = db.query(ImportJob).filter(ImportJob.id == job_id).first()

    if not job:
        return

    try:
        job.status = "processing"
        db.commit()

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

        job.processed_rows = total
        job.error_rows = errors

        job.status = "done" if errors == 0 else "error"
        db.commit()

    except Exception:
        job.status = "error"
        db.commit()

    finally:
        db.close()