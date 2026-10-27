"use client";

import Image from "next/image";
import { useEffect } from "react";
import type { Sponsor } from "../types";
import { auditAssets } from "../data/audit-assets";

interface SponsorBannerProps {
  sponsor: Sponsor;
  placement?: string;
  pageContext?: string;
}

export default function SponsorBanner({
  sponsor,
  placement = "listing-results",
  pageContext = "property-results",
}: SponsorBannerProps) {
  const asset = auditAssets.sponsorBanner;

  useEffect(() => {
    const event = {
      event: "sponsor_impression",
      sponsor_id: sponsor.sponsor_id,
      placement,
      timestamp: new Date().toISOString(),
      page_context: pageContext,
    };

    console.info("Sponsor telemetry:", event);
  }, [sponsor.sponsor_id, placement, pageContext]);

  const safeRedirect =
    `/api/sponsors/${encodeURIComponent(
      sponsor.sponsor_id,
    )}/redirect?destination=${encodeURIComponent(
      sponsor.url,
    )}`;

  return (
    <aside
      className="rounded-lg border border-gray-200 bg-gray-50 p-4"
      aria-label={`Sponsored Partner: ${sponsor.name}`}
    >
      <div className="relative mb-4 aspect-[10/3] overflow-hidden rounded-md bg-blue-50">
        <Image
          src={asset.src}
          alt={asset.alt}
          fill
          sizes="(max-width: 640px) 100vw, 700px"
          className="object-cover"
        />
      </div>

      <p className="text-sm font-semibold uppercase tracking-wide text-gray-600">
        Sponsored Partner
      </p>

      <p className="mt-1 text-lg font-semibold">
        {sponsor.name}
      </p>

      <a
        href={safeRedirect}
        target="_blank"
        rel="noopener noreferrer sponsored"
        aria-label={
          `Sponsored Partner ${sponsor.name}. ` +
          `Visit sponsor website`
        }
        className="mt-2 inline-block rounded-md text-blue-700 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
      >
        Visit {sponsor.name}
      </a>
    </aside>
  );
}
