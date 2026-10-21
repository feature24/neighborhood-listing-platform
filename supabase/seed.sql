begin;

-- Fictional public demo listings; owner records are added during auth testing.
insert into public.properties (
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

insert into public.sponsors (sponsor_id, name, url, active)
values ('sp-riverdale-coffee-co', 'Riverdale Coffee Co.', 'https://example.com', true)
on conflict (sponsor_id) do nothing;

insert into public.property_sponsors (property_id, sponsor_id)
values ('demo-property-1', 'sp-riverdale-coffee-co')
on conflict do nothing;

commit;
-- Sponsor selection demo data for assignment/audit.
insert into public.sponsors (
  sponsor_id,
  name,
  url,
  active,
  status,
  placement,
  target_zip,
  radius_miles,
  distance_miles,
  tier,
  impressions,
  start_at,
  end_at
) values
(
  'sponsor-a',
  'Sponsor A',
  'https://example.com/a',
  true,
  'APPROVED',
  'listing-results',
  '90032',
  5,
  0.4,
  'SILVER',
  120,
  '2026-01-01T00:00:00Z',
  '2027-01-01T00:00:00Z'
),
(
  'sponsor-b',
  'Sponsor B',
  'https://example.com/b',
  true,
  'APPROVED',
  'listing-results',
  '90032',
  5,
  1.2,
  'GOLD',
  45,
  '2026-01-01T00:00:00Z',
  '2027-01-01T00:00:00Z'
),
(
  'sponsor-c',
  'Sponsor C',
  'https://example.com/c',
  true,
  'APPROVED',
  'listing-results',
  '90032',
  5,
  0.8,
  'GOLD',
  90,
  '2026-01-01T00:00:00Z',
  '2027-01-01T00:00:00Z'
),
(
  'sponsor-d',
  'Sponsor D',
  'https://example.com/d',
  true,
  'PENDING',
  'listing-results',
  '90032',
  5,
  0.2,
  'PLATINUM',
  10,
  '2026-01-01T00:00:00Z',
  '2027-01-01T00:00:00Z'
)
on conflict (sponsor_id) do update set
  name = excluded.name,
  url = excluded.url,
  active = excluded.active,
  status = excluded.status,
  placement = excluded.placement,
  target_zip = excluded.target_zip,
  radius_miles = excluded.radius_miles,
  distance_miles = excluded.distance_miles,
  tier = excluded.tier,
  impressions = excluded.impressions,
  start_at = excluded.start_at,
  end_at = excluded.end_at;
