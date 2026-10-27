"use client";

import Image from "next/image";
import type { Property } from "../types";
import { auditAssets } from "../data/audit-assets";

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const asset = auditAssets.propertyListing;

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="relative mb-4 aspect-[16/9] overflow-hidden rounded-md bg-gray-100">
        <Image
          src={asset.src}
          alt={asset.alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
        />
      </div>

      <h3 className="text-xl font-semibold">
        {property.address}
      </h3>

      <address className="mt-1 not-italic text-gray-600">
        {property.city}, {property.state} {property.zip_code}
      </address>

      <p className="mt-2 text-lg font-bold">
        ${property.price.toLocaleString()}
      </p>

      <ul className="mt-2 flex flex-wrap gap-3 text-sm text-gray-700">
        <li>{property.bedrooms} bedrooms</li>
        <li>{property.bathrooms} bathrooms</li>
        <li>{property.square_feet.toLocaleString()} sq ft</li>
      </ul>

      <p className="mt-3 text-sm text-gray-600">
        Amenities: {property.amenities.join(", ")}
      </p>

      <button
        type="button"
        onClick={() => alert(`${property.address} added to favorites`)}
        aria-label={`Add ${property.address} to favorites`}
        className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
      >
        Favorite
      </button>
    </article>
  );
}
