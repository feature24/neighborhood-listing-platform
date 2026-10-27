# Digital Asset Pipeline & Performance Audit

## Asset 1 — Primary Property Listing Image

- Asset: `property-listing.svg`
- Category: Primary property listing photo/graphic
- Source: Original project asset created for this audit
- Owner: Neighborhood Listing Platform project
- License: Original project work
- Approval: `APPROVED`
- Accessibility purpose: Informational
- Alt text: `Illustration of a neighborhood property listing with a house and front lawn`
- 390px rendered width: 314px
- 1280px rendered width: 334px
- Transferred size: 1.2 kB
- Content type: `image/svg+xml`
- Download time: 3 ms
- Performance risk: Large raster images could increase page weight
- Optimization: SVG format plus responsive Next.js Image sizing

## Asset 2 — Sponsor C Banner

- Asset: `sponsor-c-banner.svg`
- Category: Local business partner ad banner
- Source: Original project asset created for this audit
- Owner: Neighborhood Listing Platform project
- License: Original project work
- Approval: `APPROVED`
- Accessibility purpose: Informational commercial content
- Alt text: `Sponsor C local partner banner`
- 390px rendered width: 314px
- 1280px rendered width: 1118px
- Transferred size: 1.2 kB
- Content type: `image/svg+xml`
- Download time: 2 ms
- Performance risk: A large banner can become expensive if stored as an oversized raster image
- Optimization: Lightweight SVG and responsive `sizes` configuration

## Asset 3 — Neighborhood Pin

- Asset: `neighborhood-pin.svg`
- Category: UI/navigation graphic
- Source: Original project asset created for this audit
- Owner: Neighborhood Listing Platform project
- License: Original project work
- Approval: `APPROVED`
- Accessibility purpose: Decorative
- Alt text: Empty
- ARIA: `aria-hidden="true"`
- 390px rendered width: 44px
- 1280px rendered width: 44px
- Transferred size: 558 B
- Content type: `image/svg+xml`
- Download time: 11 ms
- Performance risk: Decorative icons can create unnecessary requests if oversized or duplicated
- Optimization: Small reusable SVG with fixed dimensions

## Responsive Behavior Summary

At 390px, both the property image and sponsor banner render at 314px and fit the single-column mobile layout.

At 1280px, the property image renders at 334px within its card while the sponsor banner expands to 1118px across the wider content area.

The navigation pin remains fixed at 44px on both viewport sizes.

## Accessibility Summary

The property and sponsor graphics are informational and use descriptive alt text.

The navigation pin is decorative, so it uses an empty alt value and `aria-hidden="true"` to avoid unnecessary screen-reader announcements.

## Performance Summary

All three assets use SVG, which keeps transfer size very small while preserving sharp rendering across different viewport sizes.

Measured transfer sizes ranged from 558 B to 1.2 kB.

Measured download times ranged from 2 ms to 11 ms.
