from app.core.celery_app import celery_app
from app.infrastructure.database import SessionLocal
from app.domain.models.import_job import ImportJob

from datetime import datetime

import pandas as pd
import traceback


@celery_app.task(name="app.tasks.import_tasks.process_excel")
def process_excel(job_id: str):

    print(f"🔥 TASK INICIADA: {job_id}")

    db = SessionLocal()

    try:
        # BUSCA JOB
        job = db.query(ImportJob).filter(
            ImportJob.id == job_id
        ).first()

        if not job:
            print("❌ Job não encontrado")
            return

        # INÍCIO PROCESSAMENTO
        job.status = "processing"
        job.started_at = datetime.utcnow().replace(microsecond=0)

        db.commit()

        print("📄 Lendo Excel...")

        # LEITURA EXCEL
        df = pd.read_excel(job.file_path)

        total_rows = len(df)

        job.total_rows = total_rows

        db.commit()

        processed_rows = 0
        error_rows = 0

        # PROCESSA LINHAS
        for index, row in df.iterrows():

            try:
                row_data = row.to_dict()

                print(f"✅ Linha {index + 1}:")
                print(row_data)

                processed_rows += 1

            except Exception as row_error:

                print(f"❌ Erro na linha {index + 1}")
                print(str(row_error))

                error_rows += 1

        # FINALIZAÇÃO
        job.processed_rows = processed_rows
        job.error_rows = error_rows

        if error_rows > 0:
            job.status = "error"
        else:
            job.status = "done"

        job.finished_at = datetime.utcnow().replace(microsecond=0)

        db.commit()

        print("✅ PROCESSAMENTO FINALIZADO")

    except Exception as e:

        print("❌ ERRO GERAL:")
        traceback.print_exc()

        try:
            job.status = "error"
            job.finished_at = datetime.utcnow().replace(microsecond=0)

            db.commit()

        except Exception:
            pass

    finally:
        db.close()