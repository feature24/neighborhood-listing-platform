export default function Home() {
  const features = [
    {
      title: "Listings",
      description: "Browse available homes and properties in your neighborhood.",
    },
    {
      title: "Neighborhood Sponsors",
      description: "Discover local businesses and organizations supporting the community.",
    },
    {
      title: "Voice Help",
      description: "Get simple voice-assisted help while exploring neighborhood resources.",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16 text-gray-900">
      <div className="mx-auto max-w-5xl">
        <header className="mb-12">
          <h1 className="text-4xl font-bold">Neighborhood Listing Platform</h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-600">
            A simple platform for finding local property listings, community
            sponsors, and helpful neighborhood resources.
          </p>
        </header>

        <section
          aria-labelledby="features-heading"
          className="grid gap-6 md:grid-cols-3"
        >
          <h2 id="features-heading" className="sr-only">
            Platform features
          </h2>

          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="mt-3 text-gray-600">{feature.description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}