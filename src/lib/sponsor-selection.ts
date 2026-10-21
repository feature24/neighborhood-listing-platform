import type { Sponsor } from "@/types";

export interface SponsorContext {
  propertyZip: string;
  placement: string;
  now?: Date;
}

const tierRank: Record<Sponsor["tier"], number> = {
  PLATINUM: 3,
  GOLD: 2,
  SILVER: 1,
};

export function isSponsorEligible(
  context: SponsorContext,
  sponsor: Sponsor,
): boolean {
  const now = context.now ?? new Date();

  if (sponsor.status !== "APPROVED") return false;
  if (!sponsor.active) return false;
  if (sponsor.placement !== context.placement) return false;

  const start = new Date(sponsor.start_at);
  const end = new Date(sponsor.end_at);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  if (now < start || now > end) return false;

  const exactZip = sponsor.target_zip === context.propertyZip;
  const withinRadius = sponsor.distance_miles <= sponsor.radius_miles;

  return exactZip || withinRadius;
}

export function selectSponsor(
  context: SponsorContext,
  candidates: Sponsor[],
): Sponsor | null {
  const eligible = candidates.filter((sponsor) =>
    isSponsorEligible(context, sponsor),
  );

  if (eligible.length === 0) return null;

  return [...eligible].sort((a, b) => {
    const zipA = a.target_zip === context.propertyZip ? 1 : 0;
    const zipB = b.target_zip === context.propertyZip ? 1 : 0;

    if (zipA !== zipB) return zipB - zipA;

    if (tierRank[a.tier] !== tierRank[b.tier]) {
      return tierRank[b.tier] - tierRank[a.tier];
    }

    if (a.distance_miles !== b.distance_miles) {
      return a.distance_miles - b.distance_miles;
    }

    if (a.impressions !== b.impressions) {
      return a.impressions - b.impressions;
    }

    return a.sponsor_id.localeCompare(b.sponsor_id);
  })[0];
}
