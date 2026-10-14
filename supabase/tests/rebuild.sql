begin;
create schema lab5_rebuild_check;

create table lab5_rebuild_check.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  created_at timestamptz not null default now()
);

create table lab5_rebuild_check.properties (
  property_id text primary key default gen_random_uuid()::text,
  user_id uuid references lab5_rebuild_check.profiles(user_id) on delete restrict,
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

create table lab5_rebuild_check.sponsors (
  sponsor_id text primary key default gen_random_uuid()::text,
  name text not null check (char_length(name) between 1 and 150),
  url text not null check (url ~ '^https://'),
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create table lab5_rebuild_check.property_sponsors (
  property_id text not null references lab5_rebuild_check.properties(property_id) on delete cascade,
  sponsor_id text not null references lab5_rebuild_check.sponsors(sponsor_id) on delete cascade,
  primary key (property_id, sponsor_id)
);

create table lab5_rebuild_check.inquiries (
  inquiry_id uuid primary key default gen_random_uuid(),
  property_id text not null references lab5_rebuild_check.properties(property_id) on delete cascade,
  user_id uuid not null references lab5_rebuild_check.profiles(user_id) on delete cascade,
  message text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index properties_user_id_idx on lab5_rebuild_check.properties(user_id);
create index inquiries_user_id_idx on lab5_rebuild_check.inquiries(user_id);
create index inquiries_property_id_idx on lab5_rebuild_check.inquiries(property_id);
create index property_sponsors_sponsor_id_idx on lab5_rebuild_check.property_sponsors(sponsor_id);

create function lab5_rebuild_check.touch_property_updated_at()
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
before update on lab5_rebuild_check.properties
for each row execute function lab5_rebuild_check.touch_property_updated_at();

alter table lab5_rebuild_check.profiles enable row level security;
alter table lab5_rebuild_check.properties enable row level security;
alter table lab5_rebuild_check.sponsors enable row level security;
alter table lab5_rebuild_check.property_sponsors enable row level security;
alter table lab5_rebuild_check.inquiries enable row level security;

-- Explicit grants: policies filter rows, grants restrict operations/columns.
revoke all on lab5_rebuild_check.profiles, lab5_rebuild_check.properties, lab5_rebuild_check.sponsors,
  lab5_rebuild_check.property_sponsors, lab5_rebuild_check.inquiries from anon, authenticated;

grant usage on schema lab5_rebuild_check to anon, authenticated, service_role;

grant select on lab5_rebuild_check.properties, lab5_rebuild_check.sponsors,
  lab5_rebuild_check.property_sponsors to anon, authenticated;

grant select, insert on lab5_rebuild_check.profiles to authenticated;
grant update (display_name) on lab5_rebuild_check.profiles to authenticated;

grant insert (
  property_id, user_id, address, city, state, zip_code,
  price, bedrooms, bathrooms, square_feet, amenities
) on lab5_rebuild_check.properties to authenticated;

-- Owners cannot change owner IDs or approve their own listings.
grant update (
  address, city, state, zip_code, price,
  bedrooms, bathrooms, square_feet, amenities
) on lab5_rebuild_check.properties to authenticated;

grant delete on lab5_rebuild_check.properties to authenticated;
grant select, insert on lab5_rebuild_check.inquiries to authenticated;

grant all on lab5_rebuild_check.profiles, lab5_rebuild_check.properties, lab5_rebuild_check.sponsors,
  lab5_rebuild_check.property_sponsors, lab5_rebuild_check.inquiries to service_role;

create policy profiles_read_own on lab5_rebuild_check.profiles
for select to authenticated
using ((select auth.uid()) = user_id);

create policy profiles_insert_own on lab5_rebuild_check.profiles
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy profiles_update_own on lab5_rebuild_check.profiles
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy properties_read_approved on lab5_rebuild_check.properties
for select to anon, authenticated
using (approved = true);

create policy properties_read_own on lab5_rebuild_check.properties
for select to authenticated
using ((select auth.uid()) = user_id);

create policy properties_insert_own on lab5_rebuild_check.properties
for insert to authenticated
with check ((select auth.uid()) = user_id and approved = false);

create policy properties_update_own_unapproved on lab5_rebuild_check.properties
for update to authenticated
using ((select auth.uid()) = user_id and approved = false)
with check ((select auth.uid()) = user_id and approved = false);

create policy properties_delete_own_unapproved on lab5_rebuild_check.properties
for delete to authenticated
using ((select auth.uid()) = user_id and approved = false);

create policy sponsors_read_active on lab5_rebuild_check.sponsors
for select to anon, authenticated
using (active = true);

create policy property_sponsors_read_public on lab5_rebuild_check.property_sponsors
for select to anon, authenticated
using (
  exists (
    select 1 from lab5_rebuild_check.properties p
    where p.property_id = property_sponsors.property_id and p.approved = true
  )
  and exists (
    select 1 from lab5_rebuild_check.sponsors s
    where s.sponsor_id = property_sponsors.sponsor_id and s.active = true
  )
);

create policy inquiries_read_own_or_listing_owner on lab5_rebuild_check.inquiries
for select to authenticated
using (
  (select auth.uid()) = user_id
  or exists (
    select 1 from lab5_rebuild_check.properties p
    where p.property_id = inquiries.property_id
      and p.user_id = (select auth.uid())
  )
);

create policy inquiries_insert_own on lab5_rebuild_check.inquiries
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from lab5_rebuild_check.properties p
    where p.property_id = inquiries.property_id and p.approved = true
  )
);



-- Fictional lab5_rebuild_check demo listings; owner records are added during auth testing.
insert into lab5_rebuild_check.properties (
  property_id, address, city, state, zip_code,
  price, bedrooms, bathrooms, square_feet, amenities, approved
) values
('demo-property-1', '101 Example Lane', 'Pico Rivera', 'CA', '90660',
  650000, 3, 2, 1400, array['Garage', 'Backyard'], true),
('demo-property-2', '202 Sample Avenue', 'Whittier', 'CA', '90601',
  720000, 4, 2, 1800, array['Patio', 'Central air'], true),
('demo-property-3', '303 Fictional Street', 'Norwalk', 'CA', '90650',
  590000, 2, 1, 1100, array['Garage'], true),
('demo-private-1', '404 Hidden Court', 'Whittier', 'CA', '90601',
  500000, 2, 1, 1000, array['Patio'], false)
on conflict (property_id) do nothing;

insert into lab5_rebuild_check.sponsors (sponsor_id, name, url, active)
values ('sp-riverdale-coffee-co', 'Riverdale Coffee Co.', 'https://example.com', true)
on conflict (sponsor_id) do nothing;

insert into lab5_rebuild_check.property_sponsors (property_id, sponsor_id)
values ('demo-property-1', 'sp-riverdale-coffee-co')
on conflict do nothing;


select 'PASS: clean schema rebuilt and seeded' as result, count(*) as properties from lab5_rebuild_check.properties;
rollback;