from app.core.celery_app import celery_app
from app.infrastructure.database import SessionLocal
from app.domain.models.import_job import ImportJob

from app.application.pricing_service import PricingService
from app.models.schemas.pricing import PricingHistoryCreate

from datetime import datetime
import pandas as pd


@celery_app.task(name="app.tasks.import_tasks.process_excel")
def process_excel(job_id: str):

    print(f"🔥 TASK INICIADA: {job_id}")

    db = SessionLocal()

    try:
        job = db.query(ImportJob).filter(ImportJob.id == job_id).first()

        if not job:
            print("❌ Job não encontrado")
            return

        # STATUS PROCESSANDO
        job.status = "processing"
        job.started_at = datetime.utcnow().replace(microsecond=0)
        db.commit()

        print("📄 Lendo Excel...")

        df = pd.read_excel(job.file_path)

        total = len(df)

        job.total_rows = total
        db.commit()

        processed = 0
        errors = 0

        for index, row in df.iterrows():

            try:

                row_data = row.to_dict()

                print(f"✅ Linha {index + 1}")

                pricing_payload = PricingHistoryCreate(

                    cliente=str(row_data.get("Cliente", "")),
                    sku=str(row_data.get("SKU", f"SKU-{index+1}")),

                    datasul_code=None,

                    category=str(row_data.get("Categoria", "Geral")),
                    subcategory=str(row_data.get("Subcategoria", "Padrão")),

                    size=None,
                    manager=None,
                    channel=None,

                    status="Ativo",

                    current_price=float(row_data.get("Preço", 0)),

                    previous_price=None,

                    cost=float(row_data.get("Custo", 0))
                    if row_data.get("Custo") is not None
                    else None,

                    margin=float(row_data.get("Margem", 0))
                    if row_data.get("Margem") is not None
                    else None,

                    currency="BRL",

                    month=str(row_data.get("Mês", "2026-01")),

                    updated_at_source=None
                )

                PricingService.create(pricing_payload)

                processed += 1

            except Exception as e:

                errors += 1

                print(f"❌ ERRO NA LINHA {index + 1}")
                print(str(e))

        # FINALIZAÇÃO

        job.processed_rows = processed
        job.error_rows = errors

        if errors > 0:
            job.status = "error"
        else:
            job.status = "done"

        job.finished_at = datetime.utcnow().replace(microsecond=0)

        db.commit()

        print("✅ PROCESSAMENTO FINALIZADO")

    except Exception as e:

        print("❌ ERRO GERAL")
        print(str(e))

        if job:
            job.status = "error"
            job.finished_at = datetime.utcnow().replace(microsecond=0)
            db.commit()

    finally:

        db.close()