import type { Sponsor } from "../types";

interface SponsorBannerProps {
  sponsor: Sponsor;
}

export default function SponsorBanner({ sponsor }: SponsorBannerProps) {
  return (
    <aside
      className="rounded-lg border border-gray-200 bg-gray-50 p-4"
      aria-label="Sponsored content"
    >
      <p className="text-sm font-semibold uppercase tracking-wide text-gray-600">
        Sponsored
      </p>

      <p className="mt-1 text-lg font-semibold">{sponsor.name}</p>

      <a
        href={sponsor.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Visit ${sponsor.name} website`}
        className="mt-2 inline-block rounded-md text-blue-700 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
      >
        Visit {sponsor.name}
      </a>
    </aside>
  );
}