-- ============================================================
-- ETHNIC OS — SUPABASE SCHEMA
-- Run this in the Supabase SQL Editor
-- ============================================================

create extension if not exists "uuid-ossp";

-- ── COMPANIES ────────────────────────────────────────────────
create table if not exists companies (
  id            uuid primary key default uuid_generate_v4(),
  created_date  timestamptz default now(),
  updated_date  timestamptz default now(),
  name          text not null,
  city          text,
  country       text,
  website       text,
  category      text,
  notes         text
);

-- ── PEOPLE (CRM contacts) ────────────────────────────────────
create table if not exists people (
  id              uuid primary key default uuid_generate_v4(),
  created_date    timestamptz default now(),
  updated_date    timestamptz default now(),
  name            text not null,
  email           text,
  phone           text,
  city            text,
  country         text,
  company_name    text,
  company_id      uuid references companies(id) on delete set null,
  pipeline        text default 'lead',
  tags            text[] default '{}',
  notes           text,
  total_spent     numeric(10,2) default 0,
  avatar_url      text,
  website         text,
  instagram       text,
  linkedin        text,
  category        text,
  source          text,
  linked_user_id  uuid
);

-- ── EVENTS ───────────────────────────────────────────────────
create table if not exists events (
  id              uuid primary key default uuid_generate_v4(),
  created_date    timestamptz default now(),
  updated_date    timestamptz default now(),
  title           text not null,
  title_fr        text,
  date            date,
  time            text,
  city            text,
  venue           text,
  country         text default 'France',
  status          text default 'draft',
  cover_image     text,
  gallery         text[] default '{}',
  description     text,
  description_fr  text,
  ticket_link     text,
  ticket_types    jsonb default '[]',
  facebook_url    text,
  instagram_url   text,
  tags            text[] default '{}'
);

-- ── PROJECTS ─────────────────────────────────────────────────
create table if not exists projects (
  id                uuid primary key default uuid_generate_v4(),
  created_date      timestamptz default now(),
  updated_date      timestamptz default now(),
  name              text not null,
  type              text default 'event',
  description       text,
  status            text default 'planning',
  budget            numeric(10,2) default 0,
  currency          text default 'EUR',
  start_date        date,
  end_date          date,
  schedule_start    text,
  schedule_end      text,
  location          text,
  team_members      text[] default '{}',
  lineup            jsonb default '[]',
  related_event_id  uuid references events(id) on delete set null,
  notes             text
);

-- ── TASKS ────────────────────────────────────────────────────
create table if not exists tasks (
  id            uuid primary key default uuid_generate_v4(),
  created_date  timestamptz default now(),
  updated_date  timestamptz default now(),
  title         text not null,
  status        text default 'todo',
  priority      text default 'medium',
  due_date      date,
  assigned_to   text,
  project_id    uuid references projects(id) on delete cascade,
  notes         text
);

-- ── PRODUCTS ─────────────────────────────────────────────────
create table if not exists products (
  id              uuid primary key default uuid_generate_v4(),
  created_date    timestamptz default now(),
  updated_date    timestamptz default now(),
  name            text not null,
  name_fr         text,
  description     text,
  description_fr  text,
  images          text[] default '{}',
  category        text default 'merch',
  price           numeric(10,2) not null default 0,
  stock           integer default 0,
  status          text default 'draft',
  variants        jsonb default '[]',
  stripe_price_id text
);

-- ── ORDERS ───────────────────────────────────────────────────
create table if not exists orders (
  id                uuid primary key default uuid_generate_v4(),
  created_date      timestamptz default now(),
  updated_date      timestamptz default now(),
  customer_name     text,
  customer_email    text,
  shipping_address  text,
  status            text default 'pending',
  total             numeric(10,2) default 0,
  items             jsonb default '[]',
  stripe_session_id text,
  notes             text
);

-- ── COMMUNITY MEMBERS ────────────────────────────────────────
create table if not exists community_members (
  id                  uuid primary key default uuid_generate_v4(),
  created_date        timestamptz default now(),
  updated_date        timestamptz default now(),
  name                text not null,
  email               text,
  phone               text,
  bio                 text,
  avatar_url          text,
  application_type    text default 'member',
  status              text default 'pending',
  membership_plan     numeric(10,2),
  stripe_customer_id  text,
  linked_contact_id   uuid references people(id) on delete set null
);

-- ── CONTENT ITEMS ────────────────────────────────────────────
create table if not exists content_items (
  id                  uuid primary key default uuid_generate_v4(),
  created_date        timestamptz default now(),
  updated_date        timestamptz default now(),
  title               text not null,
  title_fr            text,
  type                text default 'article',
  status              text default 'draft',
  content             text,
  content_fr          text,
  cover_image         text,
  tags                text[] default '{}',
  related_event_id    uuid references events(id) on delete set null,
  related_project_id  uuid references projects(id) on delete set null
);

-- ── MEDIA ITEMS ──────────────────────────────────────────────
create table if not exists media_items (
  id            uuid primary key default uuid_generate_v4(),
  created_date  timestamptz default now(),
  updated_date  timestamptz default now(),
  name          text,
  url           text not null,
  size          bigint,
  mime_type     text,
  storage_path  text
);

-- ── MODULE PERMISSIONS ───────────────────────────────────────
create table if not exists module_permissions (
  id                    uuid primary key default uuid_generate_v4(),
  created_date          timestamptz default now(),
  updated_date          timestamptz default now(),
  user_email            text not null unique,
  user_name             text,
  account_type          text default 'customer',
  status                text default 'active',
  projects_access       text default 'read_only',
  events_access         text default 'read_only',
  communication_access  text default 'read_only',
  souq_access           text default 'read_only',
  crm_access            text default 'read_only',
  linked_contact_id     uuid references people(id) on delete set null,
  supabase_user_id      uuid references auth.users(id) on delete cascade
);

-- ── DECO ITEMS (Inventaire) ──────────────────────────────────
create table if not exists deco_items (
  id                  uuid primary key default uuid_generate_v4(),
  created_date        timestamptz default now(),
  updated_date        timestamptz default now(),
  name                text not null,
  category            text default 'autre',
  dimensions          text,
  weight              text,
  quantity            integer default 1,
  quantity_available  integer default 1,
  photos              text[] default '{}',
  drive_link          text,
  notes               text,
  condition           text default 'bon'
);

-- ── CONTACTS (used in ComPlanTab + GlobalSearch) ─────────────
create table if not exists contacts (
  id            uuid primary key default uuid_generate_v4(),
  created_date  timestamptz default now(),
  updated_date  timestamptz default now(),
  name          text not null,
  email         text,
  phone         text,
  organization  text,
  role          text,
  notes         text
);

-- ── COM POSTS (communication plan) ──────────────────────────
create table if not exists com_posts (
  id                uuid primary key default uuid_generate_v4(),
  created_date      timestamptz default now(),
  updated_date      timestamptz default now(),
  title             text not null,
  project_id        uuid references projects(id) on delete cascade,
  project_name      text,
  publication_date  date,
  deadline          date,
  channels          text[] default '{}',
  details           text,
  deliverable       text,
  owner_id          uuid references contacts(id) on delete set null,
  owner_name        text,
  status            text default 'nouveau',
  notes             text
);

-- ── UPDATED_DATE TRIGGERS ────────────────────────────────────
create or replace function update_updated_date()
returns trigger as $$
begin
  new.updated_date = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_date_people before update on people for each row execute function update_updated_date();
create trigger set_updated_date_companies before update on companies for each row execute function update_updated_date();
create trigger set_updated_date_events before update on events for each row execute function update_updated_date();
create trigger set_updated_date_projects before update on projects for each row execute function update_updated_date();
create trigger set_updated_date_tasks before update on tasks for each row execute function update_updated_date();
create trigger set_updated_date_products before update on products for each row execute function update_updated_date();
create trigger set_updated_date_orders before update on orders for each row execute function update_updated_date();
create trigger set_updated_date_community_members before update on community_members for each row execute function update_updated_date();
create trigger set_updated_date_content_items before update on content_items for each row execute function update_updated_date();
create trigger set_updated_date_media_items before update on media_items for each row execute function update_updated_date();
create trigger set_updated_date_module_permissions before update on module_permissions for each row execute function update_updated_date();
create trigger set_updated_date_deco_items before update on deco_items for each row execute function update_updated_date();
create trigger set_updated_date_contacts before update on contacts for each row execute function update_updated_date();
create trigger set_updated_date_com_posts before update on com_posts for each row execute function update_updated_date();

-- ── ROW LEVEL SECURITY ───────────────────────────────────────
-- Enable RLS on all tables (start permissive, tighten later)
alter table people enable row level security;
alter table companies enable row level security;
alter table events enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table community_members enable row level security;
alter table content_items enable row level security;
alter table media_items enable row level security;
alter table module_permissions enable row level security;
alter table deco_items enable row level security;
alter table contacts enable row level security;
alter table com_posts enable row level security;

-- Permissive policies for authenticated users (tighten per module later)
create policy "Authenticated users can read all" on people for select to authenticated using (true);
create policy "Authenticated users can insert" on people for insert to authenticated with check (true);
create policy "Authenticated users can update" on people for update to authenticated using (true);
create policy "Authenticated users can delete" on people for delete to authenticated using (true);

create policy "Authenticated users can read all" on companies for select to authenticated using (true);
create policy "Authenticated users can insert" on companies for insert to authenticated with check (true);
create policy "Authenticated users can update" on companies for update to authenticated using (true);
create policy "Authenticated users can delete" on companies for delete to authenticated using (true);

create policy "Authenticated users can read all" on events for select to authenticated using (true);
create policy "Public can read published events" on events for select to anon using (status = 'published');
create policy "Authenticated users can insert" on events for insert to authenticated with check (true);
create policy "Authenticated users can update" on events for update to authenticated using (true);
create policy "Authenticated users can delete" on events for delete to authenticated using (true);

create policy "Authenticated users can read all" on projects for select to authenticated using (true);
create policy "Authenticated users can insert" on projects for insert to authenticated with check (true);
create policy "Authenticated users can update" on projects for update to authenticated using (true);
create policy "Authenticated users can delete" on projects for delete to authenticated using (true);

create policy "Authenticated users can read all" on tasks for select to authenticated using (true);
create policy "Authenticated users can insert" on tasks for insert to authenticated with check (true);
create policy "Authenticated users can update" on tasks for update to authenticated using (true);
create policy "Authenticated users can delete" on tasks for delete to authenticated using (true);

create policy "Authenticated users can read all" on products for select to authenticated using (true);
create policy "Public can read published products" on products for select to anon using (status = 'published');
create policy "Authenticated users can insert" on products for insert to authenticated with check (true);
create policy "Authenticated users can update" on products for update to authenticated using (true);
create policy "Authenticated users can delete" on products for delete to authenticated using (true);

create policy "Authenticated users can read all" on orders for select to authenticated using (true);
create policy "Authenticated users can insert" on orders for insert to authenticated with check (true);
create policy "Authenticated users can update" on orders for update to authenticated using (true);
create policy "Authenticated users can delete" on orders for delete to authenticated using (true);

create policy "Anyone can apply to community" on community_members for insert to anon with check (true);
create policy "Authenticated users can read all" on community_members for select to authenticated using (true);
create policy "Authenticated users can update" on community_members for update to authenticated using (true);
create policy "Authenticated users can delete" on community_members for delete to authenticated using (true);

create policy "Authenticated users can read all" on content_items for select to authenticated using (true);
create policy "Public can read published content" on content_items for select to anon using (status = 'published');
create policy "Authenticated users can insert" on content_items for insert to authenticated with check (true);
create policy "Authenticated users can update" on content_items for update to authenticated using (true);
create policy "Authenticated users can delete" on content_items for delete to authenticated using (true);

create policy "Authenticated users can read all" on media_items for select to authenticated using (true);
create policy "Authenticated users can insert" on media_items for insert to authenticated with check (true);
create policy "Authenticated users can update" on media_items for update to authenticated using (true);
create policy "Authenticated users can delete" on media_items for delete to authenticated using (true);

create policy "Users can read own permissions" on module_permissions for select to authenticated using (auth.jwt() ->> 'email' = user_email);
create policy "Authenticated users can insert" on module_permissions for insert to authenticated with check (true);
create policy "Authenticated users can update" on module_permissions for update to authenticated using (true);

create policy "Authenticated users can read all" on deco_items for select to authenticated using (true);
create policy "Authenticated users can insert" on deco_items for insert to authenticated with check (true);
create policy "Authenticated users can update" on deco_items for update to authenticated using (true);
create policy "Authenticated users can delete" on deco_items for delete to authenticated using (true);

create policy "Authenticated users can read all" on contacts for select to authenticated using (true);
create policy "Authenticated users can insert" on contacts for insert to authenticated with check (true);
create policy "Authenticated users can update" on contacts for update to authenticated using (true);
create policy "Authenticated users can delete" on contacts for delete to authenticated using (true);

create policy "Authenticated users can read all" on com_posts for select to authenticated using (true);
create policy "Authenticated users can insert" on com_posts for insert to authenticated with check (true);
create policy "Authenticated users can update" on com_posts for update to authenticated using (true);
create policy "Authenticated users can delete" on com_posts for delete to authenticated using (true);

-- ── STORAGE BUCKETS ──────────────────────────────────────────
-- Run these separately in the Supabase dashboard > Storage
-- or via the API:
-- insert into storage.buckets (id, name, public) values ('media', 'media', true);
-- insert into storage.buckets (id, name, public) values ('products', 'products', true);
-- insert into storage.buckets (id, name, public) values ('deco', 'deco', true);
