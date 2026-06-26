"""
Exécute les chunks SQL générés par import_shotgun_csv.py directement contre Supabase.

Usage:
  set DB_PASSWORD=ton_mot_de_passe
  python scripts/run_import.py

Le mot de passe BDD se trouve dans :
  Supabase Dashboard > Settings > Database > Connection string
"""
import os
import sys
import time
from pathlib import Path
import psycopg2

DB_PASSWORD = os.environ.get("DB_PASSWORD")
if not DB_PASSWORD:
    print("ERREUR: variable d'environnement DB_PASSWORD manquante.")
    print("Set it with: set DB_PASSWORD=ton_password  (Windows cmd)")
    print("        or: $env:DB_PASSWORD='ton_password'  (PowerShell)")
    sys.exit(1)

PROJECT_REF = "oliymrqfkpyjjpizjtja"
# Direct DB connection (port 5432)
CONN_PARAMS = dict(
    host=f"db.{PROJECT_REF}.supabase.co",
    port=5432,
    dbname="postgres",
    user="postgres",
    password=DB_PASSWORD,
    sslmode="require",
)

CHUNKS_DIR = Path(__file__).parent / "sql_chunks"

def main():
    chunks = sorted(CHUNKS_DIR.glob("chunk_*.sql"))
    if not chunks:
        print(f"Aucun chunk trouve dans {CHUNKS_DIR}")
        sys.exit(1)

    print(f"[connect] Connexion a Supabase...")
    conn = psycopg2.connect(**CONN_PARAMS)
    conn.autocommit = False
    cur = conn.cursor()

    # Pre-flight check
    cur.execute("select count(*) from people;")
    before = cur.fetchone()[0]
    print(f"[info] people table contains {before} rows before import")

    total_processed = 0
    start = time.time()

    try:
        for i, chunk_file in enumerate(chunks, 1):
            chunk_start = time.time()
            sql = chunk_file.read_text(encoding="utf-8")
            cur.execute(sql)
            conn.commit()
            elapsed = time.time() - chunk_start

            # Count after this chunk
            cur.execute("select count(*) from people;")
            current = cur.fetchone()[0]
            inserted_this_chunk = current - (before + total_processed) if i == 1 else "??"
            total_processed = current - before

            print(f"  [{i:2d}/{len(chunks)}] {chunk_file.name} done in {elapsed:.1f}s | total people now: {current}")
    except Exception as e:
        print(f"[ERROR] {type(e).__name__}: {e}")
        conn.rollback()
        sys.exit(1)
    finally:
        cur.close()
        conn.close()

    duration = time.time() - start
    print(f"\n[done] Import terminé en {duration:.1f}s")
    print(f"[done] +{total_processed} contacts (avant: {before}, apres: {before + total_processed})")

if __name__ == "__main__":
    main()
