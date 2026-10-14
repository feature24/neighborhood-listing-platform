begin;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  created_at timestamptz not null default now()
);

create table public.properties (
  property_id text primary key default gen_random_uuid()::text,
  user_id uuid references public.profiles(user_id) on delete restrict,
  address text not null check (char_length(address) between 1 and 200),
  city text not null check (char_length(city) between 1 and 100),
  state text not null check (state ~ '^[A-Z]{2}$'),
  zip_code text not null check (zip_code ~ '^[0-9]{5}$'),
  price numeric(12,2) not null check (price >= 0),
  bedrooms integer not null check (bedrooms between 0 and 30),
  bathrooms numeric(4,1) not null check (bathrooms between 0 and 30),
  square_feet integer not null check (square_feet > 0),
  amenities text[] not null default '{}',
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sponsors (
  sponsor_id text primary key default gen_random_uuid()::text,
  name text not null check (char_length(name) between 1 and 150),
  url text not null check (url ~ '^https://'),
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.property_sponsors (
  property_id text not null references public.properties(property_id) on delete cascade,
  sponsor_id text not null references public.sponsors(sponsor_id) on delete cascade,
  primary key (property_id, sponsor_id)
);

create table public.inquiries (
  inquiry_id uuid primary key default gen_random_uuid(),
  property_id text not null references public.properties(property_id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  message text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index properties_user_id_idx on public.properties(user_id);
create index inquiries_user_id_idx on public.inquiries(user_id);
create index inquiries_property_id_idx on public.inquiries(property_id);
create index property_sponsors_sponsor_id_idx on public.property_sponsors(sponsor_id);

create function public.touch_property_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger properties_updated_at
before update on public.properties
for each row execute function public.touch_property_updated_at();

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.sponsors enable row level security;
alter table public.property_sponsors enable row level security;
alter table public.inquiries enable row level security;

-- Explicit grants: policies filter rows, grants restrict operations/columns.
revoke all on public.profiles, public.properties, public.sponsors,
  public.property_sponsors, public.inquiries from anon, authenticated;

grant usage on schema public to anon, authenticated, service_role;

grant select on public.properties, public.sponsors,
  public.property_sponsors to anon, authenticated;

grant select, insert on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

grant insert (
  property_id, user_id, address, city, state, zip_code,
  price, bedrooms, bathrooms, square_feet, amenities
) on public.properties to authenticated;

-- Owners cannot change owner IDs or approve their own listings.
grant update (
  address, city, state, zip_code, price,
  bedrooms, bathrooms, square_feet, amenities
) on public.properties to authenticated;

grant delete on public.properties to authenticated;
grant select, insert on public.inquiries to authenticated;

grant all on public.profiles, public.properties, public.sponsors,
  public.property_sponsors, public.inquiries to service_role;

create policy profiles_read_own on public.profiles
for select to authenticated
using ((select auth.uid()) = user_id);

create policy profiles_insert_own on public.profiles
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy profiles_update_own on public.profiles
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy properties_read_approved on public.properties
for select to anon, authenticated
using (approved = true);

create policy properties_read_own on public.properties
for select to authenticated
using ((select auth.uid()) = user_id);

create policy properties_insert_own on public.properties
for insert to authenticated
with check ((select auth.uid()) = user_id and approved = false);

create policy properties_update_own_unapproved on public.properties
for update to authenticated
using ((select auth.uid()) = user_id and approved = false)
with check ((select auth.uid()) = user_id and approved = false);

create policy properties_delete_own_unapproved on public.properties
for delete to authenticated
using ((select auth.uid()) = user_id and approved = false);

create policy sponsors_read_active on public.sponsors
for select to anon, authenticated
using (active = true);

create policy property_sponsors_read_public on public.property_sponsors
for select to anon, authenticated
using (
  exists (
    select 1 from public.properties p
    where p.property_id = property_sponsors.property_id and p.approved = true
  )
  and exists (
    select 1 from public.sponsors s
    where s.sponsor_id = property_sponsors.sponsor_id and s.active = true
  )
);

create policy inquiries_read_own_or_listing_owner on public.inquiries
for select to authenticated
using (
  (select auth.uid()) = user_id
  or exists (
    select 1 from public.properties p
    where p.property_id = inquiries.property_id
      and p.user_id = (select auth.uid())
  )
);

create policy inquiries_insert_own on public.inquiries
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.properties p
    where p.property_id = inquiries.property_id and p.approved = true
  )
);

commit;