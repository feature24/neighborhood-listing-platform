# Digital Asset Pipeline Audit Inventory

## Asset 1 — Primary Property Listing Image

- File: `/public/audit/property-listing.svg`
- Category: Primary property listing image
- Source: Original project asset
- Owner: Neighborhood Listing Platform project
- License: Original project work
- Approval field: `approvalStatus: "APPROVED"`
- Accessibility purpose: Informational
- Alt text: `Illustration of a neighborhood property listing with a house and front lawn`
- Responsive implementation: Next.js `Image` with `fill` and responsive `sizes`
- Performance format: SVG vector asset

## Asset 2 — Local Business Partner Banner

- File: `/public/audit/sponsor-c-banner.svg`
- Category: Local business partner ad banner
- Source: Original project asset
- Owner: Neighborhood Listing Platform project
- License: Original project work
- Approval field: `approvalStatus: "APPROVED"`
- Accessibility purpose: Informational commercial content
- Alt text: `Sponsor C local partner banner`
- Responsive implementation: Next.js `Image` with `fill` and responsive `sizes`
- Performance format: SVG vector asset

## Asset 3 — UI / Navigation Icon

- File: `/public/audit/neighborhood-pin.svg`
- Category: UI/navigation graphic
- Source: Original project asset
- Owner: Neighborhood Listing Platform project
- License: Original project work
- Approval field: `approvalStatus: "APPROVED"`
- Accessibility purpose: Decorative
- Alt text: empty
- ARIA: `aria-hidden="true"`
- Responsive implementation: Next.js `Image`
- Performance format: SVG vector asset

## Performance Risk

The primary risk is loading unnecessarily large raster files for simple graphics.

These audit assets use SVG vector graphics so they remain sharp at different viewport sizes while transferring very small files.

The property and sponsor assets also use explicit aspect ratios and responsive Next.js `sizes` values to avoid unnecessary layout movement and oversized responsive requests.
