# Database Authorization Matrix and RLS Verification

## Target table and schema context

The target table is public.properties in my neighborhood listing platform.
Each listing has a property_id, an owner user_id, listing details, and an
approved flag. user_id references public.profiles. The profiles table
references Supabase auth.users.

RLS is enabled on all five application tables. The exact versioned SQL
definition is included below.

## Role operations matrix

| Role | Permitted operation | Denied operation | Enforcement |
|---|---|---|---|
| Anonymous user | SELECT approved listings | INSERT a listing | SELECT requires approved = true. The anon role has no INSERT grant. |
| Resource owner | UPDATE their own unapproved listing details | UPDATE approved to true | UPDATE requires auth.uid() = user_id AND approved = false. Column grants exclude approved and user_id. |
| Other authenticated user | SELECT approved listings | UPDATE another user's unapproved listing | Public SELECT requires approved = true. UPDATE requires auth.uid() = user_id AND approved = false; another owner's row is excluded. |
| Administrator (service_role) | UPDATE approval, including hidden listings | UPDATE price to -1 | service_role bypasses RLS, but the CHECK constraint price >= 0 still rejects invalid data. This denial is data integrity enforcement, not an RLS authorization denial. |

Administrators have no RLS-denied CRUD operation in this design.
Service-role credentials must remain in trusted server environments.
The application routes use the publishable/anon key and the verified user's
JWT for user operations, preserving RLS enforcement.

## Verification evidence

- docs/evidence/public-read.txt: public app GET returned HTTP 200.
- docs/evidence/anonymous-post.txt: app POST without auth returned HTTP 401.
- docs/evidence/rls-tests.txt: actual direct database requests, auth header
  states, payloads, response statuses, and response bodies.
- supabase/tests/admin-access.sql: administrator role test, with rollback.
- Administrator SQL result observed:
  PASS: administrator read and approval succeeded; negative price rejected
  property_id: demo-private-1; approved: true; price: 500000.00.
  The approved value was observed inside the transaction before rollback.

API keys and test user JWTs are redacted in evidence.

## Empty array versus explicit denial

An anonymous SELECT targeting the existing hidden demo-private-1 row
returned HTTP 200 with []. RLS filtered the row from the visible result.
This prevents disclosure of the record and does not prove that the record
does not exist. A nonexistent record can produce the same result.

An explicit HTTP 403 indicates that the requested action is forbidden.
For our anonymous database INSERT, the missing INSERT privilege caused
SQLSTATE 42501, with the actual HTTP status captured in the evidence.
The app separately returns HTTP 401 when sign-in is missing.

An unauthorized UPDATE can also return HTTP 200 with [] because zero rows
match the RLS predicate. Our test checked the price again as the owner
and confirmed it stayed at 410000. HTTP success alone does not prove
that an update changed a record.

## Exact migration SQL

```sql
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
```

## Actual diagnostic requests and responses

```text
TEST: owner profile lookup
GET https://wmuolccgsluxlbppgvze.supabase.co/rest/v1/profiles?user_id=eq.ad1584a8-ff50-47ba-9a0e-3c320101a563&select=user_id
Authorization: Bearer [REDACTED TEST USER JWT]
apikey: [REDACTED]
Request body: (none)
HTTP 200 OK
Response body: []

TEST: owner profile creation
POST https://wmuolccgsluxlbppgvze.supabase.co/rest/v1/profiles
Authorization: Bearer [REDACTED TEST USER JWT]
apikey: [REDACTED]
Content-Type: application/json
Prefer: return=representation
Request body: {"user_id":"ad1584a8-ff50-47ba-9a0e-3c320101a563","display_name":"Fictional owner"}
HTTP 201 Created
Response body: [{"user_id":"ad1584a8-ff50-47ba-9a0e-3c320101a563","display_name":"Fictional owner","created_at":"2026-10-14T04:34:45.964396+00:00"}]

TEST: other profile lookup
GET https://wmuolccgsluxlbppgvze.supabase.co/rest/v1/profiles?user_id=eq.f085436c-3e78-48a0-a7ee-83790a0b443f&select=user_id
Authorization: Bearer [REDACTED TEST USER JWT]
apikey: [REDACTED]
Request body: (none)
HTTP 200 OK
Response body: []

TEST: other profile creation
POST https://wmuolccgsluxlbppgvze.supabase.co/rest/v1/profiles
Authorization: Bearer [REDACTED TEST USER JWT]
apikey: [REDACTED]
Content-Type: application/json
Prefer: return=representation
Request body: {"user_id":"f085436c-3e78-48a0-a7ee-83790a0b443f","display_name":"Fictional other"}
HTTP 201 Created
Response body: [{"user_id":"f085436c-3e78-48a0-a7ee-83790a0b443f","display_name":"Fictional other","created_at":"2026-10-14T04:34:46.457116+00:00"}]

TEST: Anonymous approved read
GET https://wmuolccgsluxlbppgvze.supabase.co/rest/v1/properties?property_id=eq.demo-property-1&select=property_id
Authorization: absent
apikey: [REDACTED]
Request body: (none)
HTTP 200 OK
Response body: [{"property_id":"demo-property-1"}]

TEST: Anonymous hidden read
GET https://wmuolccgsluxlbppgvze.supabase.co/rest/v1/properties?property_id=eq.demo-private-1&select=property_id
Authorization: absent
apikey: [REDACTED]
Request body: (none)
HTTP 200 OK
Response body: []

TEST: Anonymous database insert denied
POST https://wmuolccgsluxlbppgvze.supabase.co/rest/v1/properties
Authorization: absent
apikey: [REDACTED]
Content-Type: application/json
Prefer: return=representation
Request body: {"property_id":"rls-test-bab4b554-87f8-452c-aecd-66a550f0c3f7","user_id":"ad1584a8-ff50-47ba-9a0e-3c320101a563","address":"505 Test Owner Lane","city":"Pico Rivera","state":"CA","zip_code":"90660","price":400000,"bedrooms":2,"bathrooms":1,"square_feet":1000,"amenities":["Test patio"]}
HTTP 401 Unauthorized
Response body: {"code":"42501","details":null,"hint":"Grant the required privileges to the current role with: GRANT INSERT ON public.properties TO anon;","message":"permission denied for table properties"}

TEST: Owner creates listing
POST https://wmuolccgsluxlbppgvze.supabase.co/rest/v1/properties
Authorization: Bearer [REDACTED TEST USER JWT]
apikey: [REDACTED]
Content-Type: application/json
Prefer: return=representation
Request body: {"property_id":"rls-test-bab4b554-87f8-452c-aecd-66a550f0c3f7","user_id":"ad1584a8-ff50-47ba-9a0e-3c320101a563","address":"505 Test Owner Lane","city":"Pico Rivera","state":"CA","zip_code":"90660","price":400000,"bedrooms":2,"bathrooms":1,"square_feet":1000,"amenities":["Test patio"]}
HTTP 201 Created
Response body: [{"property_id":"rls-test-bab4b554-87f8-452c-aecd-66a550f0c3f7","user_id":"ad1584a8-ff50-47ba-9a0e-3c320101a563","address":"505 Test Owner Lane","city":"Pico Rivera","state":"CA","zip_code":"90660","price":400000.00,"bedrooms":2,"bathrooms":1.0,"square_feet":1000,"amenities":["Test patio"],"approved":false,"created_at":"2026-10-14T04:34:47.167097+00:00","updated_at":"2026-10-14T04:34:47.167097+00:00"}]

TEST: Owner updates own listing
PATCH https://wmuolccgsluxlbppgvze.supabase.co/rest/v1/properties?property_id=eq.rls-test-bab4b554-87f8-452c-aecd-66a550f0c3f7
Authorization: Bearer [REDACTED TEST USER JWT]
apikey: [REDACTED]
Content-Type: application/json
Prefer: return=representation
Request body: {"price":410000}
HTTP 200 OK
Response body: [{"property_id":"rls-test-bab4b554-87f8-452c-aecd-66a550f0c3f7","user_id":"ad1584a8-ff50-47ba-9a0e-3c320101a563","address":"505 Test Owner Lane","city":"Pico Rivera","state":"CA","zip_code":"90660","price":410000.00,"bedrooms":2,"bathrooms":1.0,"square_feet":1000,"amenities":["Test patio"],"approved":false,"created_at":"2026-10-14T04:34:47.167097+00:00","updated_at":"2026-10-14T04:34:47.417416+00:00"}]

TEST: Other user reads owner private listing
GET https://wmuolccgsluxlbppgvze.supabase.co/rest/v1/properties?property_id=eq.rls-test-bab4b554-87f8-452c-aecd-66a550f0c3f7&select=property_id
Authorization: Bearer [REDACTED TEST USER JWT]
apikey: [REDACTED]
Request body: (none)
HTTP 200 OK
Response body: []

TEST: Other user update blocked
PATCH https://wmuolccgsluxlbppgvze.supabase.co/rest/v1/properties?property_id=eq.rls-test-bab4b554-87f8-452c-aecd-66a550f0c3f7
Authorization: Bearer [REDACTED TEST USER JWT]
apikey: [REDACTED]
Content-Type: application/json
Prefer: return=representation
Request body: {"price":1}
HTTP 200 OK
Response body: []

TEST: Owner verifies denied update changed nothing
GET https://wmuolccgsluxlbppgvze.supabase.co/rest/v1/properties?property_id=eq.rls-test-bab4b554-87f8-452c-aecd-66a550f0c3f7&select=price
Authorization: Bearer [REDACTED TEST USER JWT]
apikey: [REDACTED]
Request body: (none)
HTTP 200 OK
Response body: [{"price":410000.00}]

TEST: Other user spoofs owner during insert
POST https://wmuolccgsluxlbppgvze.supabase.co/rest/v1/properties
Authorization: Bearer [REDACTED TEST USER JWT]
apikey: [REDACTED]
Content-Type: application/json
Prefer: return=representation
Request body: {"property_id":"spoof-d8339789-f4c1-40c8-a253-51fe1634e74e","user_id":"ad1584a8-ff50-47ba-9a0e-3c320101a563","address":"505 Test Owner Lane","city":"Pico Rivera","state":"CA","zip_code":"90660","price":400000,"bedrooms":2,"bathrooms":1,"square_feet":1000,"amenities":["Test patio"]}
HTTP 403 Forbidden
Response body: {"code":"42501","details":null,"hint":null,"message":"new row violates row-level security policy for table \"properties\""}

TEST: Owner self-approval denied
PATCH https://wmuolccgsluxlbppgvze.supabase.co/rest/v1/properties?property_id=eq.rls-test-bab4b554-87f8-452c-aecd-66a550f0c3f7
Authorization: Bearer [REDACTED TEST USER JWT]
apikey: [REDACTED]
Content-Type: application/json
Prefer: return=representation
Request body: {"approved":true}
HTTP 403 Forbidden
Response body: {"code":"42501","details":null,"hint":"Grant the required privileges to the current role with: GRANT UPDATE ON public.properties TO authenticated;","message":"permission denied for table properties"}

TEST: App rejects invalid authenticated listing
POST http://localhost:3000/api/properties
Authorization: Bearer [REDACTED TEST USER JWT]
Content-Type: application/json
Request body: {"address":"Invalid","price":-1}
HTTP 400 Bad Request
Response body: {"error":"Invalid listing fields."}

TEST: App creates authenticated owner listing
POST http://localhost:3000/api/properties
Authorization: Bearer [REDACTED TEST USER JWT]
Content-Type: application/json
Request body: {"address":"505 Test Owner Lane","city":"Pico Rivera","state":"CA","zip_code":"90660","price":400000,"bedrooms":2,"bathrooms":1,"square_feet":1000,"amenities":["Test patio"]}
HTTP 201 Created
Response body: {"property":{"property_id":"a5addce0-9a2f-4496-8719-5e6d650d45ab","address":"505 Test Owner Lane","city":"Pico Rivera","state":"CA","zip_code":"90660","price":400000,"bedrooms":2,"bathrooms":1,"square_feet":1000,"amenities":["Test patio"]}}

TEST: Owner deletes test listing
DELETE https://wmuolccgsluxlbppgvze.supabase.co/rest/v1/properties?property_id=eq.rls-test-bab4b554-87f8-452c-aecd-66a550f0c3f7
Authorization: Bearer [REDACTED TEST USER JWT]
apikey: [REDACTED]
Prefer: return=representation
Request body: (none)
HTTP 200 OK
Response body: [{"property_id":"rls-test-bab4b554-87f8-452c-aecd-66a550f0c3f7","user_id":"ad1584a8-ff50-47ba-9a0e-3c320101a563","address":"505 Test Owner Lane","city":"Pico Rivera","state":"CA","zip_code":"90660","price":410000.00,"bedrooms":2,"bathrooms":1.0,"square_feet":1000,"amenities":["Test patio"],"approved":false,"created_at":"2026-10-14T04:34:47.167097+00:00","updated_at":"2026-10-14T04:34:47.417416+00:00"}]

TEST: Owner deletes test listing
DELETE https://wmuolccgsluxlbppgvze.supabase.co/rest/v1/properties?property_id=eq.a5addce0-9a2f-4496-8719-5e6d650d45ab
Authorization: Bearer [REDACTED TEST USER JWT]
apikey: [REDACTED]
Prefer: return=representation
Request body: (none)
HTTP 200 OK
Response body: [{"property_id":"a5addce0-9a2f-4496-8719-5e6d650d45ab","user_id":"ad1584a8-ff50-47ba-9a0e-3c320101a563","address":"505 Test Owner Lane","city":"Pico Rivera","state":"CA","zip_code":"90660","price":400000.00,"bedrooms":2,"bathrooms":1.0,"square_feet":1000,"amenities":["Test patio"],"approved":false,"created_at":"2026-10-14T04:34:48.472779+00:00","updated_at":"2026-10-14T04:34:48.472779+00:00"}]

```