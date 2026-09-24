"use client";
export default function SearchFilters() {
  return (
    <form
      className="rounded-lg border border-gray-200 bg-white p-4"
      onSubmit={(event) => event.preventDefault()}
    >
      <h2 className="text-xl font-semibold">Search Properties</h2>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="location" className="block font-medium">
            Location
          </label>
          <input
            id="location"
            name="location"
            type="text"
            className="mt-1 w-full rounded-md border border-gray-300 p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          />
        </div>

        <div>
          <label htmlFor="minPrice" className="block font-medium">
            Minimum Price
          </label>
          <input
            id="minPrice"
            name="minPrice"
            type="number"
            min="0"
            className="mt-1 w-full rounded-md border border-gray-300 p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          />
        </div>

        <div>
          <label htmlFor="bedrooms" className="block font-medium">
            Bedrooms
          </label>
          <select
            id="bedrooms"
            name="bedrooms"
            className="mt-1 w-full rounded-md border border-gray-300 p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <option value="">Any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
      >
        Search properties
      </button>
    </form>
  );
}