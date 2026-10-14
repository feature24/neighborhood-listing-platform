"use client";

import { useEffect, useState } from "react";
import PropertyCard from "./PropertyCard";
import SponsorBanner from "./SponsorBanner";
import type { Property, Sponsor } from "../types";

export default function ListingResults() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/properties", {
          cache: "no-store", signal: controller.signal,
        });
        if (!response.ok) throw new Error("Unable to load listings.");
        const data = await response.json();
        setProperties(data.properties);
        setSponsors(data.sponsors);
      } catch {
        if (!controller.signal.aborted) {
          setError("We could not load the listings. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt]);

  return (
    <section className="mt-8" aria-labelledby="properties-heading" aria-busy={loading}>
      <h2 id="properties-heading" className="text-2xl font-bold">
        Available Properties
      </h2>
      {loading ? (
        <p className="mt-4" role="status">Loading properties...</p>
      ) : error ? (
        <div className="mt-4">
          <p role="alert">{error}</p>
          <button type="button" onClick={() => setAttempt(value => value + 1)}
            className="mt-3 rounded bg-blue-600 px-4 py-2 text-white">
            Try again
          </button>
        </div>
      ) : (
        <>
          {properties.length === 0 ? (
            <p className="mt-4" role="status">No approved listings available yet.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {properties.map(property => (
                <PropertyCard key={property.property_id} property={property} />
              ))}
            </div>
          )}
          <div className="mt-8 space-y-4">
            {sponsors.map(sponsor => (
              <SponsorBanner key={sponsor.sponsor_id} sponsor={sponsor} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}