"use client";

import type { Property } from "../types";

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  return (
    <article className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <img
        src={property.imageUrl}
        alt={`${property.title} at ${property.address}, ${property.city}`}
        className="h-48 w-full object-cover"
      />

      <div className="p-4">
        <h3 className="text-xl font-semibold">{property.title}</h3>

        <address className="mt-1 not-italic text-gray-600">
          {property.address}, {property.city}
        </address>

        <p className="mt-2 text-lg font-bold">
          ${property.price.toLocaleString()}
        </p>

        <ul className="mt-2 flex flex-wrap gap-3 text-sm text-gray-700">
          <li>{property.bedrooms} bedrooms</li>
          <li>{property.bathrooms} bathrooms</li>
          <li>{property.squareFeet.toLocaleString()} sq ft</li>
        </ul>

        <button
          type="button"
          onClick={() => alert(`${property.title} added to favorites`)}
          aria-label={`Add ${property.title} to favorites`}
          className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          Favorite
        </button>
      </div>
    </article>
  );
}