import PropertyCard from "../components/PropertyCard";
import SearchFilters from "../components/SearchFilters";
import SponsorBanner from "../components/SponsorBanner";
import type { Property, Sponsor } from "../types";
import generatedProperties from "../../data/validated/properties.json";

const properties: Property[] = generatedProperties;

const sponsor: Sponsor = {
  sponsor_id: "sp-riverdale-coffee-co",
  name: "Riverdale Coffee Co.",
  url: "https://example.com",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 text-gray-900 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold sm:text-4xl">
            Neighborhood Listing Platform
          </h1>

          <p className="mt-3 max-w-2xl text-gray-600">
            Find local property listings and helpful neighborhood resources.
          </p>
        </header>

        <SearchFilters />

        <section className="mt-8" aria-labelledby="properties-heading">
          <h2 id="properties-heading" className="text-2xl font-bold">
            Available Properties
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <PropertyCard
                key={property.property_id}
                property={property}
              />
            ))}
          </div>
        </section>

        <div className="mt-8">
          <SponsorBanner sponsor={sponsor} />
        </div>
      </div>
    </main>
  );
}