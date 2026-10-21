# Sponsor Eligibility and Selection

## Purpose

The sponsor selector uses explicit geography and eligibility rules instead of hidden user profiling.

## Eligibility Rules

A sponsor is eligible only when all of the following are true:

1. The sponsor status is `APPROVED`.
2. The sponsor is marked active.
3. The placement matches the requested placement.
4. The current time falls between the campaign start and end dates.
5. The sponsor either:
   - exactly matches the property ZIP code, or
   - is within the approved radius.

No sensitive traits, user identity, IP address, or individualized profiling are used.

## Deterministic Selection Order

Eligible sponsors are ordered using the following precedence:

1. Exact ZIP match before radius-only match.
2. Higher sponsor tier:
   - Platinum
   - Gold
   - Silver
3. Shorter distance.
4. Fewer impressions.
5. Sponsor ID alphabetically as the final stable tie-breaker.

Because all tie-breakers are explicit, the same fixed input produces the same result.

## Audit Dataset

For the ZIP 90032 audit dataset:

- Sponsor A: Silver, 0.4 miles, 120 impressions, Approved
- Sponsor B: Gold, 1.2 miles, 45 impressions, Approved
- Sponsor C: Gold, 0.8 miles, 90 impressions, Approved
- Sponsor D: Platinum, 0.2 miles, 10 impressions, Pending

Sponsor D is excluded before ranking because its status is not `APPROVED`.

Among the remaining sponsors:

- Sponsor B and Sponsor C outrank Sponsor A because Gold outranks Silver.
- Sponsor C outranks Sponsor B because Sponsor C is closer.

Therefore, Sponsor C is selected.

## Safe Sponsor URLs

Sponsor URLs are validated with Zod.

Requirements:

- Valid URL syntax
- HTTPS only
- Raw IP-address destinations are rejected

Sponsor links use an internal redirect route.

Before redirecting, the route verifies:

- sponsor exists
- sponsor is approved
- sponsor is active
- campaign dates are valid
- stored URL is safe
- requested destination exactly matches the approved stored URL

## Disclosure and Accessibility

The sponsor card visibly displays:

`Sponsored Partner`

The sponsor link includes an ARIA label identifying the link as sponsored content before the user clicks it.

## Telemetry

The class implementation records a coarse sponsor impression event containing:

- sponsor ID
- placement
- timestamp
- page context

It does not store IP addresses or sensitive user information.

## Fallback

If no sponsor is eligible, the UI displays a neutral local neighborhood message instead of an advertisement.
