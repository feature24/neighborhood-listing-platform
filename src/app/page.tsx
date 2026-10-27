import Image from "next/image";
import SearchFilters from "../components/SearchFilters";
import ListingResults from "../components/ListingResults";
import { auditAssets } from "../data/audit-assets";

export default function Home() {
  const icon = auditAssets.navigationIcon;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 text-gray-900 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <Image
              src={icon.src}
              alt=""
              aria-hidden="true"
              width={44}
              height={44}
            />

            <h1 className="text-3xl font-bold sm:text-4xl">
              Neighborhood Listing Platform
            </h1>
          </div>

          <p className="mt-3 max-w-2xl text-gray-600">
            Find local property listings and helpful neighborhood resources.
          </p>
        </header>

        <SearchFilters />
        <ListingResults />
      </div>
    </main>
  );
}
