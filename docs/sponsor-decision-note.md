# Sponsor Selection Decision Note

## Decision

Use deterministic contextual sponsor selection based on approval state, campaign dates, placement, ZIP/radius, tier, distance, impression count, and sponsor ID.

## Why

The assignment requires predictable sponsor outcomes that are explainable and testable.

The selector avoids hidden profiling and does not use sensitive characteristics or individual identity.

## Stable Tie-Breaker

The final ordering is:

1. Exact ZIP
2. Tier
3. Distance
4. Impression count
5. Sponsor ID

The final sponsor ID comparison guarantees a stable result even when all other values are equal.

## Safety

Sponsor destinations are not linked directly from arbitrary client input.

The internal redirect route validates the approved sponsor record and blocks unsafe or mismatched destinations.

## Telemetry Restraint

Only coarse impression metadata is generated.

No IP address or sensitive user information is stored.
