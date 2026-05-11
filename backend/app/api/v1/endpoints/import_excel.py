from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid, shutil, os, time
from datetime import datetime
import pandas as pd

from app.infrastructure.database import get_db
from app.infrastructure.supabase_client import supabase
from app.domain.models.import_job import ImportJob

router = APIRouter()
UPLOAD_DIR = "uploads"

# Mapeamento de colunas do Excel → campos da tabela
# Cobre variações de nome encontradas no BD - Histórico de preços.xlsx
COLUMN_MAP = {
    # cliente
    "cliente": "cliente",
    "client": "cliente",
    # sku
    "sku": "sku",
    "produto": "sku",
    "descricao": "sku",
    "descrição": "sku",
    # datasul_code
    "codigo": "datasul_code",
    "código": "datasul_code",
    "cod": "datasul_code",
    "datasul_code": "datasul_code",
    "datasul": "datasul_code",
    "cod_datasul": "datasul_code",
    "código datasul": "datasul_code",
    "codigo datasul": "datasul_code",
    # category
    "category": "category",
    "categoria": "category",
    # subcategory
    "subcategory": "subcategory",
    "subcategoria": "subcategory",
    # size
    "size": "size",
    "tamanho": "size",
    "tam": "size",
    "canal de vendas": "size",
    # manager
    "manager": "manager",
    "gestor": "manager",
    "gestora": "manager",
    "responsavel": "manager",
    "responsável": "manager",
    # channel
    "channel": "channel",
    "canal": "channel",
    # status
    "status": "status",
    # current_price
    "current_price": "current_price",
    "preco_atual": "current_price",
    "preço atual": "current_price",
    "preco atual": "current_price",
    "preco_bruto": "current_price",
    "preço bruto": "current_price",
    "preco bruto": "current_price",
    "preco": "current_price",
    "preço": "current_price",
    "valor": "current_price",
    "preço de venda": "current_price",
    "preco de venda": "current_price",
    # previous_price
    "previous_price": "previous_price",
    "preco_anterior": "previous_price",
    "preço anterior": "previous_price",
    "preco anterior": "previous_price",
    # cost
    "cost": "cost",
    "custo": "cost",
    # margin
    "margin": "margin",
    "margem": "margin",
    "margem_%": "margin",
    "margem_%_orcada": "margin",
    "margem % orçada": "margin",
    "margem orçada": "margin",
    "margem orcada": "margin",
    "margem_%_orçada": "margin",
    # currency
    "currency": "currency",
    "moeda": "currency",
    # month
    "month": "month",
    "mes": "month",
    "mês": "month",
    "competencia": "month",
    "competência": "month",
    "periodo": "month",
    "período": "month",
    "data": "month",
}


def normalize_col(col: str) -> str:
    return col.strip().lower().replace("  ", " ")


def parse_month(value) -> str | None:
    """Converte vários formatos de data para YYYY-MM."""
    if pd.isna(value):
        return None
    s = str(value).strip()
    # Já no formato YYYY-MM
    if len(s) == 7 and s[4] == "-":
        return s
    # Timestamp do pandas: 2025-01-01 00:00:00
    if len(s) >= 7 and "-" in s:
        return s[:7]
    # Formato DD/MM/YYYY ou MM/YYYY
    if "/" in s:
        parts = s.split("/")
        if len(parts) == 3:
            return f"{parts[2][:4]}-{parts[1].zfill(2)}"
        if len(parts) == 2:
            return f"{parts[1][:4]}-{parts[0].zfill(2)}"
    return None


def parse_float(value) -> float | None:
    if pd.isna(value):
        return None
    try:
        s = str(value).strip().replace(",", ".").replace("%", "").replace("R$", "").strip()
        return round(float(s), 2)
    except Exception:
        return None


def cleanup_old_files(directory, max_age_seconds=86400):
    now = time.time()
    for filename in os.listdir(directory):
        file_path = os.path.join(directory, filename)
        if os.path.isfile(file_path):
            if now - os.path.getmtime(file_path) > max_age_seconds:
                os.remove(file_path)


def process_excel_sync(job_id: str, file_path: str, db: Session):
    job = db.query(ImportJob).filter(ImportJob.id == job_id).first()
    if not job:
        return

    job.status = "running"
    job.started_at = datetime.utcnow()
    db.commit()

    try:
        df = pd.read_excel(file_path)

        # Normaliza nomes das colunas
        df.columns = [normalize_col(str(c)) for c in df.columns]

        # Mapeia colunas encontradas
        col_rename = {}
        for col in df.columns:
            if col in COLUMN_MAP:
                col_rename[col] = COLUMN_MAP[col]

        df = df.rename(columns=col_rename)

        print(f"Colunas encontradas: {list(df.columns)}")
        print(f"Colunas mapeadas: {col_rename}")

        total = len(df)
        job.total_rows = total
        db.commit()

        processed, errors = 0, 0
        records = []

        for idx, row in df.iterrows():
            try:
                cliente = str(row.get("cliente", "") or "").strip()
                sku = str(row.get("sku", "") or "").strip()
                month = parse_month(row.get("month"))
                current_price = parse_float(row.get("current_price"))

                # Campos obrigatórios
                if not cliente or not sku or not month or current_price is None or current_price <= 0:
                    print(f"Linha {idx+2} ignorada — campos obrigatórios ausentes: cliente={cliente}, sku={sku}, month={month}, price={current_price}")
                    errors += 1
                    continue

                record = {
                    "id": str(uuid.uuid4()),
                    "cliente": cliente,
                    "sku": sku,
                    "datasul_code": str(row.get("datasul_code", "") or "").strip() or None,
                    "category": str(row.get("category", "") or "").strip() or "Outros",
                    "subcategory": str(row.get("subcategory", "") or "").strip() or None,
                    "size": str(row.get("size", "") or "").strip() or None,
                    "manager": str(row.get("manager", "") or "").strip() or None,
                    "channel": str(row.get("channel", "") or "").strip() or None,
                    "status": str(row.get("status", "Ativo") or "Ativo").strip(),
                    "current_price": current_price,
                    "previous_price": parse_float(row.get("previous_price")),
                    "cost": parse_float(row.get("cost")),
                    "margin": parse_float(row.get("margin")),
                    "currency": str(row.get("currency", "BRL") or "BRL").strip() or "BRL",
                    "month": month,
                }
                records.append(record)
                processed += 1

            except Exception as e:
                print(f"Erro na linha {idx+2}: {e}")
                errors += 1

        # Insere em lotes via Supabase
        BATCH_SIZE = 100
        for i in range(0, len(records), BATCH_SIZE):
            batch = records[i:i+BATCH_SIZE]
            supabase.table("pricing_history").insert(batch).execute()
            print(f"Lote {i//BATCH_SIZE + 1} inserido ({len(batch)} registros)")

        job.processed_rows = processed
        job.error_rows = errors
        job.status = "success" if errors == 0 else "failed"
        job.finished_at = datetime.utcnow()
        db.commit()

        print(f"Importação finalizada: {processed} ok, {errors} erros")

    except Exception as e:
        print(f"Erro fatal: {e}")
        job.status = "failed"
        job.finished_at = datetime.utcnow()
        db.commit()


@router.post("/pricing/import-excel")
def import_excel(file: UploadFile = File(...), db: Session = Depends(get_db)):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    cleanup_old_files(UPLOAD_DIR)

    # Idempotência por nome de arquivo
    existing = db.query(ImportJob).filter(ImportJob.file_name == file.filename).first()
    if existing:
        return {
            "job_id": existing.id,
            "status": existing.status,
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
    )
    db.add(job)
    db.commit()

    process_excel_sync(file_id, file_path, db)

    job = db.query(ImportJob).filter(ImportJob.id == file_id).first()
    return {
        "job_id": job.id,
        "status": job.status,
        "total_rows": job.total_rows,
        "processed_rows": job.processed_rows,
        "error_rows": job.error_rows,
    }


@router.get("/pricing/import-excel/{job_id}")
def get_import_status(job_id: str, db: Session = Depends(get_db)):
    job = db.query(ImportJob).filter(ImportJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job não encontrado")
    return {
        "job_id": job.id,
        "status": job.status,
        "total_rows": job.total_rows,
        "processed_rows": job.processed_rows,
        "error_rows": job.error_rows,
        "started_at": job.started_at,
        "finished_at": job.finished_at,
    }