begin;

alter table public.sponsors
  add column if not exists status text not null default 'PENDING'
    check (status in ('APPROVED', 'PENDING', 'REJECTED')),
  add column if not exists placement text not null default 'listing-results',
  add column if not exists target_zip text not null default '00000'
    check (target_zip ~ '^[0-9]{5}$'),
  add column if not exists radius_miles numeric(6,2) not null default 0
    check (radius_miles >= 0),
  add column if not exists distance_miles numeric(6,2) not null default 0
    check (distance_miles >= 0),
  add column if not exists tier text not null default 'SILVER'
    check (tier in ('SILVER', 'GOLD', 'PLATINUM')),
  add column if not exists impressions integer not null default 0
    check (impressions >= 0),
  add column if not exists start_at timestamptz not null default now(),
  add column if not exists end_at timestamptz not null
    default (now() + interval '1 year');

drop policy if exists sponsors_read_active on public.sponsors;

create policy sponsors_read_approved_active on public.sponsors
for select to anon, authenticated
using (
  active = true
  and status = 'APPROVED'
  and now() between start_at and end_at
);

commit;

-- Sponsor eligibility query used for the assignment audit.
-- Administrative status:
--   status = 'APPROVED' AND active = true
-- Temporal validity:
--   at_time BETWEEN start_at AND end_at
-- Geographic scope:
--   exact ZIP match OR sponsor radius match
create or replace function public.get_eligible_sponsors(
  property_zip text,
  requested_placement text,
  at_time timestamptz default now()
)
returns setof public.sponsors
language sql
stable
set search_path = ''
as $$
  select s.*
  from public.sponsors s
  where s.status = 'APPROVED'
    and s.active = true
    and s.placement = requested_placement
    and at_time between s.start_at and s.end_at
    and (
      s.target_zip = property_zip
      or s.distance_miles <= s.radius_miles
    )
  order by
    case
      when s.target_zip = property_zip then 1
      else 0
    end desc,
    case s.tier
      when 'PLATINUM' then 3
      when 'GOLD' then 2
      when 'SILVER' then 1
      else 0
    end desc,
    s.distance_miles asc,
    s.impressions asc,
    s.sponsor_id asc;
$$;

grant execute on function public.get_eligible_sponsors(
  text,
  text,
  timestamptz
) to anon, authenticated, service_role;
