"""
Import complet des exports Base44 -> Supabase, avec liaison intelligente
artistes <-> projets/evenements et tags derives des events.

Usage (PowerShell):
  $env:DB_PASSWORD='...'; python scripts/import_base44.py
"""
import csv, json, os, re, sys, unicodedata
import psycopg2
from psycopg2.extras import execute_values

DL = r"C:\Users\yacou\Downloads"
PW = os.environ.get("DB_PASSWORD")
if not PW:
    print("ERREUR: set DB_PASSWORD"); sys.exit(1)

REF = "oliymrqfkpyjjpizjtja"
CONN = dict(host=f"db.{REF}.supabase.co", port=5432, dbname="postgres",
            user="postgres", password=PW, sslmode="require")

# ---------- helpers ----------
def b44_uuid(s):
    """Convertit un ObjectId Base44 (24 hex) en UUID deterministe."""
    s = (s or "").strip()
    if len(s) != 24 or not re.fullmatch(r"[0-9a-fA-F]{24}", s):
        return None
    h = s + "00000000"
    return f"{h[0:8]}-{h[8:12]}-{h[12:16]}-{h[16:20]}-{h[20:32]}"

def arr(s):
    s = (s or "").strip()
    if not s or s == "[]":
        return []
    try:
        v = json.loads(s)
        return [str(x).strip() for x in v if str(x).strip()] if isinstance(v, list) else []
    except Exception:
        return []

def phone(s):
    s = (s or "").strip().lstrip("'").strip()
    return s or None

def nz(s):
    s = (s or "").strip()
    return s or None

def num(s):
    s = (s or "").strip().replace(",", ".")
    try: return float(s)
    except: return 0

def date_only(s):
    s = (s or "").strip()
    if not s: return None
    return s[:10]  # YYYY-MM-DD

def norm(name):
    """Normalise un nom pour matching (sans accents, majuscules, alphanum)."""
    if not name: return ""
    n = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]", "", n.lower())

def read(name):
    p = os.path.join(DL, f"{name}_export.csv")
    if not os.path.exists(p): return []
    with open(p, encoding="utf-8") as f:
        return list(csv.DictReader(f))

# ---------- connect ----------
print("[connect]")
conn = psycopg2.connect(**CONN)
conn.autocommit = False
cur = conn.cursor()

# ---------- 1. extensions de schema ----------
print("[schema] extension des tables")
cur.execute("""
alter table contacts add column if not exists type text;
alter table contacts add column if not exists tags text[] default '{}';
alter table contacts add column if not exists stage text;
alter table contacts add column if not exists country text;
alter table contacts add column if not exists city text;
alter table contacts add column if not exists cover_image text;
alter table contacts add column if not exists bio text;
alter table contacts add column if not exists related_project_ids text[] default '{}';
alter table contacts add column if not exists related_event_ids text[] default '{}';
alter table contacts add column if not exists legacy_id text;

alter table events add column if not exists end_date date;
alter table events add column if not exists related_project_id uuid;
alter table events add column if not exists location text;
alter table events add column if not exists lineup jsonb default '[]';
alter table events add column if not exists aftermovie_url text;
alter table events add column if not exists legacy_id text;

alter table projects add column if not exists team_notes text;
alter table projects add column if not exists drive_link text;
alter table projects add column if not exists shotgun_link text;
alter table projects add column if not exists ticketing_active boolean default false;
alter table projects add column if not exists legacy_id text;

alter table community_members add column if not exists country text;
alter table community_members add column if not exists city text;
alter table community_members add column if not exists discipline text;
alter table community_members add column if not exists skills text[] default '{}';
alter table community_members add column if not exists interests text[] default '{}';
alter table community_members add column if not exists is_volunteer boolean default false;
alter table community_members add column if not exists legacy_id text;

alter table tasks add column if not exists legacy_id text;
alter table com_posts add column if not exists legacy_id text;
alter table deco_items add column if not exists legacy_id text;
alter table products add column if not exists legacy_id text;
alter table people add column if not exists legacy_id text;
""")
conn.commit()

# ---------- 2. EVENTS ----------
print("[events]")
events = read("Event")
ev_rows = []
ev_by_id = {}
for r in events:
    eid = b44_uuid(r["id"])
    if not eid: continue
    title = nz(r.get("title")) or nz(r.get("title_fr")) or "Sans titre"
    ev_by_id[r["id"]] = {"uuid": eid, "title": title, "lineup": arr(r.get("lineup"))}
    ev_rows.append((
        eid, title, nz(r.get("title_fr")), date_only(r.get("date")), date_only(r.get("end_date")),
        nz(r.get("city")), nz(r.get("country")) or "France", nz(r.get("location")),
        (r.get("status") or "past").strip(), nz(r.get("cover_image")),
        json.dumps(arr(r.get("lineup"))), nz(r.get("description")), nz(r.get("description_fr")),
        nz(r.get("ticket_link")), arr(r.get("tags")), nz(r.get("aftermovie_url")),
        b44_uuid(r.get("related_project_id")), r["id"], date_only(r.get("created_date"))
    ))
execute_values(cur, """
insert into events (id, title, title_fr, date, end_date, city, country, location, status,
  cover_image, lineup, description, description_fr, ticket_link, tags, aftermovie_url,
  related_project_id, legacy_id, created_date)
values %s
on conflict (id) do update set title=excluded.title, status=excluded.status,
  cover_image=excluded.cover_image, lineup=excluded.lineup, tags=excluded.tags,
  related_project_id=excluded.related_project_id
""", ev_rows)
print(f"  {len(ev_rows)} events")

# ---------- 3. PROJECTS (avec extraction equipe Resp/Collab) ----------
print("[projects]")
def extract_team(desc):
    names = set()
    for m in re.finditer(r"(?:Resp|Collab)\s*[:.]?\s*([^\.\[\]]+)", desc or ""):
        for part in re.split(r"[,/]", m.group(1)):
            p = part.strip()
            if p and len(p) < 30 and not any(k in p.lower() for k in ["commenc", "cours", "stndby", "attente", "termin"]):
                names.add(p)
    return sorted(names)

projects = read("Project")
pr_rows = []
pr_by_id = {}
for r in projects:
    pid = b44_uuid(r["id"])
    if not pid: continue
    pr_by_id[r["id"]] = {"uuid": pid, "name": nz(r.get("name"))}
    pr_rows.append((
        pid, nz(r.get("name")) or "Sans nom", (r.get("type") or "event").strip(),
        nz(r.get("description")), (r.get("status") or "planning").strip(),
        num(r.get("budget")), (r.get("currency") or "EUR").strip(),
        date_only(r.get("start_date")), date_only(r.get("end_date")),
        nz(r.get("location")), extract_team(r.get("description")),
        b44_uuid(r.get("related_event_id")), nz(r.get("drive_link")),
        nz(r.get("shotgun_link")), (r.get("ticketing_active") == "true"),
        r["id"], date_only(r.get("created_date"))
    ))
execute_values(cur, """
insert into projects (id, name, type, description, status, budget, currency, start_date,
  end_date, location, team_members, related_event_id, drive_link, shotgun_link,
  ticketing_active, legacy_id, created_date)
values %s
on conflict (id) do update set name=excluded.name, status=excluded.status,
  budget=excluded.budget, description=excluded.description, team_members=excluded.team_members
""", pr_rows)
print(f"  {len(pr_rows)} projects")

# ---------- 4. CONTACTS (artistes/partenaires) ----------
print("[contacts artistes]")
contacts = read("Contact")
ct_rows = []
ct_by_id = {}       # base44 id -> {uuid, name, norm}
ct_by_norm = {}     # norm(name) -> base44 id
for r in contacts:
    cid = b44_uuid(r["id"])
    if not cid: continue
    name = nz(r.get("name")) or "Sans nom"
    notes = r.get("notes") or ""
    cover = nz(r.get("cover_image"))
    if not cover and notes.startswith("image:"):
        cover = notes[6:].strip(); notes = ""
    tags = arr(r.get("tags"))
    ctype = nz(r.get("type"))
    if ctype and ctype not in tags:
        tags.append(ctype)
    ct_by_id[r["id"]] = {"uuid": cid, "name": name, "tags": set(tags),
                          "rproj": set(b44_uuid(x) for x in arr(r.get("related_project_ids")) if b44_uuid(x)),
                          "revt": set()}
    ct_by_norm[norm(name)] = r["id"]
for r in contacts:
    pass  # rows built after enrichment below

# ---------- 5. LINEUP -> liaison artistes <-> projet + project.lineup ----------
print("[lineup] liaison artistes")
lineups = read("Lineup")
proj_lineup = {}  # project_uuid -> [ {...} ]
for r in lineups:
    proj_b44 = r.get("project_id")
    proj_uuid = b44_uuid(proj_b44)
    artist_name = nz(r.get("artist_name")) or ""
    cinfo = ct_by_id.get(r.get("contact_id"))
    entry = {
        "artist_name": artist_name,
        "set_time": nz(r.get("set_time")),
        "fee": num(r.get("fee")),
        "performance_type": nz(r.get("performance_type")),
        "set_duration": nz(r.get("set_duration")),
        "confirmed": r.get("confirmed") == "confirmed",
        "contact_id": cinfo["uuid"] if cinfo else None,
    }
    proj_lineup.setdefault(proj_uuid, []).append(entry)
    # tag l'artiste avec le projet
    if cinfo and proj_uuid:
        cinfo["rproj"].add(proj_uuid)
        pname = pr_by_id.get(proj_b44, {}).get("name")
        if pname: cinfo["tags"].add(f"projet:{pname}")

# applique project.lineup
for puuid, entries in proj_lineup.items():
    if puuid:
        cur.execute("update projects set lineup=%s where id=%s", (json.dumps(entries), puuid))

# ---------- 6. EVENT lineup names -> tag artistes par evenement ----------
print("[tags evenementiels]")
for b44, ev in ev_by_id.items():
    for aname in ev["lineup"]:
        key = norm(aname)
        cb44 = ct_by_norm.get(key)
        if cb44:
            ci = ct_by_id[cb44]
            ci["revt"].add(ev["uuid"])
            ci["tags"].add(f"event:{ev['title']}")

# construit et insere les contacts (apres enrichissement)
for r in contacts:
    cid = b44_uuid(r["id"])
    if not cid: continue
    ci = ct_by_id[r["id"]]
    name = ci["name"]
    notes = r.get("notes") or ""
    cover = nz(r.get("cover_image"))
    if not cover and notes.startswith("image:"):
        cover = notes[6:].strip(); notes = ""
    ct_rows.append((
        cid, name, nz(r.get("email")), phone(r.get("phone")), nz(r.get("organization")),
        nz(r.get("role")), nz(notes), nz(r.get("type")), sorted(ci["tags"]),
        nz(r.get("stage")), nz(r.get("country")), nz(r.get("city")), cover, nz(r.get("bio")),
        sorted(ci["rproj"]), sorted(ci["revt"]), r["id"], date_only(r.get("created_date"))
    ))
execute_values(cur, """
insert into contacts (id, name, email, phone, organization, role, notes, type, tags, stage,
  country, city, cover_image, bio, related_project_ids, related_event_ids, legacy_id, created_date)
values %s
on conflict (id) do update set name=excluded.name, tags=excluded.tags,
  related_project_ids=excluded.related_project_ids, related_event_ids=excluded.related_event_ids,
  cover_image=excluded.cover_image
""", ct_rows)
print(f"  {len(ct_rows)} contacts artistes/partenaires")

# ---------- 7. COMMUNITY MEMBERS (equipe) ----------
print("[community members]")
cms = read("CommunityMember")
cm_rows = []
for r in cms:
    mid = b44_uuid(r["id"])
    if not mid: continue
    cm_rows.append((
        mid, nz(r.get("name")) or "Sans nom", nz(r.get("email")), nz(r.get("bio")),
        (r.get("application_type") or "member").strip(), (r.get("status") or "pending").strip(),
        nz(r.get("country")), nz(r.get("city")), nz(r.get("discipline")),
        arr(r.get("skills")), arr(r.get("interests")), (r.get("is_volunteer") == "true"),
        r["id"], date_only(r.get("created_date"))
    ))
execute_values(cur, """
insert into community_members (id, name, email, bio, application_type, status, country, city,
  discipline, skills, interests, is_volunteer, legacy_id, created_date)
values %s
on conflict (id) do update set name=excluded.name, status=excluded.status
""", cm_rows)
print(f"  {len(cm_rows)} membres equipe")

# ---------- 8. TASKS ----------
print("[tasks]")
tasks = read("Task")
tk_rows = []
for r in tasks:
    tid = b44_uuid(r["id"])
    if not tid: continue
    pj = r.get("project_id")
    proj_uuid = b44_uuid(pj) if pj in pr_by_id else None
    tk_rows.append((
        tid, nz(r.get("title")) or "Sans titre", (r.get("status") or "todo").strip(),
        (r.get("priority") or "medium").strip(), date_only(r.get("due_date")),
        nz(r.get("assigned_to")), proj_uuid,
        nz(r.get("description")), r["id"], date_only(r.get("created_date"))
    ))
execute_values(cur, """
insert into tasks (id, title, status, priority, due_date, assigned_to, project_id, notes, legacy_id, created_date)
values %s on conflict (id) do update set status=excluded.status, title=excluded.title
""", tk_rows)
print(f"  {len(tk_rows)} tasks")

# ---------- 9. COM POSTS ----------
print("[com_posts]")
cps = read("ComPost")
cp_rows = []
for r in cps:
    cid = b44_uuid(r["id"])
    if not cid: continue
    pj = r.get("project_id")
    proj_uuid = b44_uuid(pj) if pj in pr_by_id else None
    cp_rows.append((
        cid, nz(r.get("title")) or "Sans titre", proj_uuid,
        nz(r.get("project_name")), date_only(r.get("publication_date")), date_only(r.get("deadline")),
        arr(r.get("channels")), nz(r.get("details")), nz(r.get("deliverable")),
        (r.get("status") or "nouveau").strip(), r["id"], date_only(r.get("created_date"))
    ))
execute_values(cur, """
insert into com_posts (id, title, project_id, project_name, publication_date, deadline,
  channels, details, deliverable, status, legacy_id, created_date)
values %s on conflict (id) do update set status=excluded.status, title=excluded.title
""", cp_rows)
print(f"  {len(cp_rows)} com_posts")

# ---------- 10. DECO ITEMS ----------
print("[deco_items]")
decos = read("DecoItem")
dc_rows = []
for r in decos:
    did = b44_uuid(r["id"])
    if not did: continue
    dc_rows.append((
        did, nz(r.get("name")) or "Sans nom", (r.get("category") or "autre").strip(),
        nz(r.get("dimensions")), nz(r.get("weight")), int(num(r.get("quantity")) or 1),
        int(num(r.get("quantity_available")) or 1), arr(r.get("photos")),
        nz(r.get("drive_link")), nz(r.get("notes")), (r.get("condition") or "bon").strip(),
        r["id"], date_only(r.get("created_date"))
    ))
execute_values(cur, """
insert into deco_items (id, name, category, dimensions, weight, quantity, quantity_available,
  photos, drive_link, notes, condition, legacy_id, created_date)
values %s on conflict (id) do update set name=excluded.name, quantity=excluded.quantity
""", dc_rows)
print(f"  {len(dc_rows)} deco_items")

# ---------- 11. PRODUCTS ----------
print("[products]")
prods = read("Product")
pd_rows = []
for r in prods:
    pid = b44_uuid(r["id"])
    if not pid: continue
    pd_rows.append((
        pid, nz(r.get("name")) or "Sans nom", nz(r.get("name_fr")), nz(r.get("description")),
        nz(r.get("description_fr")), arr(r.get("images")), (r.get("category") or "merch").strip(),
        num(r.get("price")), int(num(r.get("stock"))), (r.get("status") or "draft").strip(),
        r["id"], date_only(r.get("created_date"))
    ))
execute_values(cur, """
insert into products (id, name, name_fr, description, description_fr, images, category,
  price, stock, status, legacy_id, created_date)
values %s on conflict (id) do update set name=excluded.name, price=excluded.price, stock=excluded.stock
""", pd_rows)
print(f"  {len(pd_rows)} products")

# ---------- 12. PEOPLE (CRM Base44, merge par email) ----------
print("[people CRM base44]")
ppl = read("People")
seen = {}
for r in ppl:
    em = (r.get("email") or "").strip().lower()
    if em:
        seen[em] = r  # dedup par email (dernier gagne)
no_email = [r for r in ppl if not (r.get("email") or "").strip()]
uniq = list(seen.values()) + no_email
pp_rows = []
for r in uniq:
    pid = b44_uuid(r["id"])
    tags = arr(r.get("tags"))
    if "base44-crm" not in tags: tags.append("base44-crm")
    pp_rows.append((
        pid, nz(r.get("name")) or (r.get("email") or "Sans nom").split("@")[0],
        (r.get("email") or "").strip().lower() or None, phone(r.get("phone")),
        nz(r.get("city")), nz(r.get("country")), (r.get("pipeline") or "lead").strip(),
        tags, nz(r.get("notes")), num(r.get("total_spent")), nz(r.get("category")),
        "base44_crm", r["id"], date_only(r.get("created_date"))
    ))
execute_values(cur, """
insert into people (id, name, email, phone, city, country, pipeline, tags, notes,
  total_spent, category, source, legacy_id, created_date)
values %s
on conflict (lower(email)) where email is not null and email != '' do update set
  tags = (select array(select distinct unnest(people.tags || excluded.tags))),
  city = coalesce(nullif(people.city,''), excluded.city),
  country = coalesce(nullif(people.country,''), excluded.country),
  phone = coalesce(nullif(people.phone,''), excluded.phone),
  total_spent = greatest(coalesce(people.total_spent,0), coalesce(excluded.total_spent,0)),
  category = coalesce(people.category, excluded.category)
""", pp_rows)
print(f"  {len(pp_rows)} people CRM (fusionnes par email)")

conn.commit()

# ---------- recap ----------
print("\n[recap]")
for t in ["people","contacts","events","projects","community_members","tasks","com_posts","deco_items","products"]:
    cur.execute(f"select count(*) from {t}")
    print(f"  {t}: {cur.fetchone()[0]}")

cur.close(); conn.close()
print("\n[done] Import Base44 termine.")
