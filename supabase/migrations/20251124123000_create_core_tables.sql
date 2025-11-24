-- migration: create core meal-planning tables, triggers, indexes, and rls
-- purpose: provision dishes, tags, dish_tags, day_plans, and events with opinionated constraints
-- affected: public.dishes, public.tags, public.dish_tags, public.day_plans, public.events
-- notes: requires pgcrypto for uuids and pg_trgm for partial text search

begin;

-- ensure crypto + trigram capabilities required by the schema
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- helper trigger that keeps updated_at columns fresh on update operations
create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
comment on function public.set_updated_at_timestamp() is 'standard trigger used to keep updated_at columns in sync with wall clock';

-- dishes authored by a user, with validation for basic metadata
create table if not exists public.dishes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 3 and 80),
  recipe_text text check (char_length(recipe_text) <= 2000),
  url text check (char_length(url) <= 255),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dishes_user_id_id_key unique (user_id, id)
);

-- tags curated by a user; uniqueness will be enforced at the (user_id, name) level
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tags_user_id_id_key unique (user_id, id)
);

-- relation table between dishes and tags scoped per user
create table if not exists public.dish_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  dish_id uuid not null,
  tag_id uuid not null,
  created_at timestamptz not null default now(),
  constraint dish_tags_dish_fk foreign key (user_id, dish_id) references public.dishes(user_id, id) on delete cascade,
  constraint dish_tags_tag_fk foreign key (user_id, tag_id) references public.tags(user_id, id) on delete cascade,
  constraint dish_tags_dish_tag_key unique (dish_id, tag_id)
);

-- daily plan referencing the dish to be prepared on that day
create table if not exists public.day_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  dish_id uuid not null references public.dishes(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint day_plans_user_day_key unique (user_id, day)
);

-- append-only event log capturing dish creations and scheduling actions
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('dish_added', 'day_planned')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- build supporting indexes for high-frequency queries
create index if not exists dishes_user_created_idx on public.dishes (user_id, created_at desc);
create index if not exists dishes_name_trgm_idx on public.dishes using gin (name gin_trgm_ops);

create unique index if not exists tags_user_name_idx on public.tags (user_id, name);

create index if not exists dish_tags_tag_dish_idx on public.dish_tags (user_id, tag_id, dish_id);
create index if not exists dish_tags_dish_tag_idx on public.dish_tags (user_id, dish_id, tag_id);

create unique index if not exists day_plans_user_day_idx on public.day_plans (user_id, day);
create index if not exists day_plans_usage_idx on public.day_plans (user_id, dish_id, day desc);

create index if not exists events_user_created_idx on public.events (user_id, created_at desc);

-- attach updated_at maintenance triggers
create trigger dishes_set_updated_at
before update on public.dishes
for each row
execute function public.set_updated_at_timestamp();

create trigger tags_set_updated_at
before update on public.tags
for each row
execute function public.set_updated_at_timestamp();

create trigger day_plans_set_updated_at
before update on public.day_plans
for each row
execute function public.set_updated_at_timestamp();

-- rls is mandatory for user-owned tables to prevent cross-account access
alter table public.dishes enable row level security;
alter table public.tags enable row level security;
alter table public.dish_tags enable row level security;
alter table public.day_plans enable row level security;
alter table public.events enable row level security;

-- dishes policies
create policy dishes_select_anon
on public.dishes
for select
to anon
using (user_id = auth.uid());

create policy dishes_select_authenticated
on public.dishes
for select
to authenticated
using (user_id = auth.uid());

create policy dishes_insert_anon
on public.dishes
for insert
to anon
with check (user_id = auth.uid());

create policy dishes_insert_authenticated
on public.dishes
for insert
to authenticated
with check (user_id = auth.uid());

create policy dishes_update_anon
on public.dishes
for update
to anon
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy dishes_update_authenticated
on public.dishes
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy dishes_delete_anon
on public.dishes
for delete
to anon
using (user_id = auth.uid());

create policy dishes_delete_authenticated
on public.dishes
for delete
to authenticated
using (user_id = auth.uid());

-- tags policies
create policy tags_select_anon
on public.tags
for select
to anon
using (user_id = auth.uid());

create policy tags_select_authenticated
on public.tags
for select
to authenticated
using (user_id = auth.uid());

create policy tags_insert_anon
on public.tags
for insert
to anon
with check (user_id = auth.uid());

create policy tags_insert_authenticated
on public.tags
for insert
to authenticated
with check (user_id = auth.uid());

create policy tags_update_anon
on public.tags
for update
to anon
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy tags_update_authenticated
on public.tags
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy tags_delete_anon
on public.tags
for delete
to anon
using (user_id = auth.uid());

create policy tags_delete_authenticated
on public.tags
for delete
to authenticated
using (user_id = auth.uid());

-- dish_tags policies
create policy dish_tags_select_anon
on public.dish_tags
for select
to anon
using (user_id = auth.uid());

create policy dish_tags_select_authenticated
on public.dish_tags
for select
to authenticated
using (user_id = auth.uid());

create policy dish_tags_insert_anon
on public.dish_tags
for insert
to anon
with check (user_id = auth.uid());

create policy dish_tags_insert_authenticated
on public.dish_tags
for insert
to authenticated
with check (user_id = auth.uid());

create policy dish_tags_update_anon
on public.dish_tags
for update
to anon
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy dish_tags_update_authenticated
on public.dish_tags
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy dish_tags_delete_anon
on public.dish_tags
for delete
to anon
using (user_id = auth.uid());

create policy dish_tags_delete_authenticated
on public.dish_tags
for delete
to authenticated
using (user_id = auth.uid());

-- day_plans policies
create policy day_plans_select_anon
on public.day_plans
for select
to anon
using (user_id = auth.uid());

create policy day_plans_select_authenticated
on public.day_plans
for select
to authenticated
using (user_id = auth.uid());

create policy day_plans_insert_anon
on public.day_plans
for insert
to anon
with check (user_id = auth.uid());

create policy day_plans_insert_authenticated
on public.day_plans
for insert
to authenticated
with check (user_id = auth.uid());

create policy day_plans_update_anon
on public.day_plans
for update
to anon
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy day_plans_update_authenticated
on public.day_plans
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy day_plans_delete_anon
on public.day_plans
for delete
to anon
using (user_id = auth.uid());

create policy day_plans_delete_authenticated
on public.day_plans
for delete
to authenticated
using (user_id = auth.uid());

-- events policies
create policy events_select_anon
on public.events
for select
to anon
using (user_id = auth.uid());

create policy events_select_authenticated
on public.events
for select
to authenticated
using (user_id = auth.uid());

create policy events_insert_anon
on public.events
for insert
to anon
with check (user_id = auth.uid());

create policy events_insert_authenticated
on public.events
for insert
to authenticated
with check (user_id = auth.uid());

create policy events_update_anon
on public.events
for update
to anon
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy events_update_authenticated
on public.events
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy events_delete_anon
on public.events
for delete
to anon
using (user_id = auth.uid());

create policy events_delete_authenticated
on public.events
for delete
to authenticated
using (user_id = auth.uid());

commit;

