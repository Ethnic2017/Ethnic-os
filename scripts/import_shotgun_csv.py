"""
Convertit le CSV Shotgun en SQL INSERT pour Supabase `people`.
Génère plusieurs fichiers chunk_001.sql, chunk_002.sql... pour batcher l'import.

Usage: python import_shotgun_csv.py <chemin_csv> [taille_batch]
"""
import csv
import sys
import os
from pathlib import Path
from datetime import datetime

CSV_PATH = sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\yacou\Downloads\audience (1).csv"
BATCH_SIZE = int(sys.argv[2]) if len(sys.argv) > 2 else 300
OUTPUT_DIR = Path(__file__).parent / "sql_chunks"
OUTPUT_DIR.mkdir(exist_ok=True)

def sql_escape(value):
    """Escape une string pour SQL — double les apostrophes."""
    if value is None or value == "":
        return "NULL"
    return "'" + str(value).replace("'", "''") + "'"

def parse_iso_date(s):
    """Parse une date ISO 8601 et retourne un literal SQL ou NULL."""
    if not s or s.strip() == "":
        return "NULL"
    try:
        # 2026-04-16T07:30:51.456Z
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        return f"'{dt.isoformat()}'::timestamptz"
    except Exception:
        return "NULL"

def parse_number(s):
    """Parse un float, retourne 0 si vide."""
    if not s or s.strip() == "":
        return "0"
    try:
        return str(float(s))
    except ValueError:
        return "0"

def build_tags(newsletter, notifications, subscriber, total_evts):
    """Construit le tableau de tags PostgreSQL."""
    tags = ["shotgun"]
    if newsletter == "Oui":
        tags.append("newsletter")
    if notifications == "Oui":
        tags.append("notifications")
    if subscriber == "Oui":
        tags.append("subscriber")
    try:
        n_evts = int(total_evts) if total_evts and total_evts.strip() else 0
        if n_evts >= 5:
            tags.append("vip-5plus")
        elif n_evts >= 2:
            tags.append("regular-2plus")
    except ValueError:
        pass
    # PostgreSQL text[] literal: ARRAY['tag1','tag2','tag3']
    quoted = ",".join("'" + t.replace("'", "''") + "'" for t in tags)
    return f"ARRAY[{quoted}]"

def build_notes(row):
    """Crée un champ notes avec les métadonnées qui ne rentrent pas ailleurs."""
    parts = []
    if row.get("Code postal"): parts.append(f"CP: {row['Code postal']}")
    if row.get("Département"): parts.append(f"Dept: {row['Département']}")
    if row.get("Zone géographique"): parts.append(f"Zone: {row['Zone géographique']}")
    if row.get("Âge"): parts.append(f"Âge: {row['Âge']}")
    if row.get("Genre"): parts.append(f"Genre: {row['Genre']}")
    if row.get("Total évènements"): parts.append(f"Évts: {row['Total évènements']}")
    if row.get("Dernier achat"): parts.append(f"Dernier achat: {row['Dernier achat'][:10]}")
    return " | ".join(parts) if parts else None

def build_insert_values(row):
    """Construit la partie VALUES (...) d'un INSERT pour une ligne."""
    name = f"{row.get('Prénom', '').strip()} {row.get('Nom', '').strip()}".strip()
    if not name:
        name = row.get("E-mail", "").split("@")[0]  # fallback

    return (
        f"("
        f"{sql_escape(name)}, "                                     # name
        f"{sql_escape(row.get('E-mail', '').strip().lower() or None)}, "  # email
        f"{sql_escape(row.get('Téléphone', '').strip() or None)}, "       # phone
        f"{sql_escape(row.get('Ville', '').strip() or None)}, "           # city
        f"{sql_escape(row.get('Pays', '').strip() or None)}, "            # country
        f"'lead', "                                                       # pipeline
        f"{build_tags(row.get('Abonné à la newsletter'), row.get('Abonné aux notifications'), row.get('Abonné'), row.get('Total évènements'))}, "  # tags
        f"{sql_escape(build_notes(row))}, "                               # notes
        f"{parse_number(row.get('Total dépensé', '0'))}, "                # total_spent
        f"'shotgun', "                                                    # source
        f"{parse_iso_date(row.get('Ajouté'))}"                            # created_date override
        f")"
    )

def main():
    print(f"[lecture]Lecture : {CSV_PATH}")

    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"[ok]{len(rows)} lignes lues")

    # Filter: skip rows with no email AND no name (useless)
    valid_rows = [r for r in rows if (r.get("E-mail", "").strip() or (r.get("Prénom") or "").strip())]
    print(f"[ok]{len(valid_rows)} lignes valides (avec email ou nom)")

    # Deduplicate by email (lowercase). Keep the LAST occurrence (most recent in CSV).
    by_email = {}
    no_email_rows = []
    for r in valid_rows:
        email = r.get("E-mail", "").strip().lower()
        if email:
            by_email[email] = r  # last one wins
        else:
            no_email_rows.append(r)
    valid_rows = list(by_email.values()) + no_email_rows
    print(f"[ok]{len(valid_rows)} lignes uniques apres deduplication par email")

    # Build chunks
    chunks = [valid_rows[i:i+BATCH_SIZE] for i in range(0, len(valid_rows), BATCH_SIZE)]
    print(f"[chunks]{len(chunks)} fichiers SQL à générer ({BATCH_SIZE} lignes max chacun)")

    for i, chunk in enumerate(chunks, 1):
        values_sql = ",\n  ".join(build_insert_values(row) for row in chunk)

        sql = f"""-- Chunk {i}/{len(chunks)} ({len(chunk)} contacts)
insert into people (name, email, phone, city, country, pipeline, tags, notes, total_spent, source, created_date)
values
  {values_sql}
on conflict (lower(email)) where email is not null and email != '' do update set
  name = excluded.name,
  phone = coalesce(nullif(excluded.phone, ''), people.phone),
  city = coalesce(nullif(excluded.city, ''), people.city),
  country = coalesce(nullif(excluded.country, ''), people.country),
  tags = (select array(select distinct unnest(people.tags || excluded.tags))),
  total_spent = greatest(coalesce(excluded.total_spent, 0), coalesce(people.total_spent, 0)),
  notes = excluded.notes,
  updated_date = now();
"""

        out_file = OUTPUT_DIR / f"chunk_{i:03d}.sql"
        out_file.write_text(sql, encoding="utf-8")
        print(f"  -{out_file.name} ({len(chunk)} rows, {len(sql)} chars)")

    print(f"\n[done]Terminé. Tous les SQL sont dans : {OUTPUT_DIR}")
    print(f"   Total : {sum(len(c) for c in chunks)} contacts à importer")

if __name__ == "__main__":
    main()
