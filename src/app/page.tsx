import PropertyCard from "../components/PropertyCard";
import SearchFilters from "../components/SearchFilters";
import SponsorBanner from "../components/SponsorBanner";
import type { Property, Sponsor } from "../types";

const properties: Property[] = [
  {
    id: "1",
    title: "Modern Family Home",
    address: "123 Maple Street",
    city: "Whittier, CA",
    price: 725000,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1650,
    imageUrl: "https://images.unsplash.com/photo-1568605114967-8130f3a36994",
  },
  {
    id: "2",
    title: "Cozy Neighborhood House",
    address: "456 Oak Avenue",
    city: "Pico Rivera, CA",
    price: 649000,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1420,
    imageUrl: "https://images.unsplash.com/photo-1570129477492-45c003edd2be",
  },
  {
    id: "3",
    title: "Spacious Two-Story Home",
    address: "789 Pine Drive",
    city: "Norwalk, CA",
    price: 810000,
    bedrooms: 4,
    bathrooms: 3,
    squareFeet: 2100,
    imageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6",
  },
];

const sponsor: Sponsor = {
  id: "1",
  name: "Neighborhood Home Services",
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
              <PropertyCard key={property.id} property={property} />
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