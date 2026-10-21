import { NextResponse } from "next/server";
import { database } from "@/lib/database";
import { propertyInput } from "@/lib/property-schema";
import { sponsorSchema } from "@/lib/sponsor-schema";
import { selectSponsor } from "@/lib/sponsor-selection";

export const dynamic = "force-dynamic";

const columns =
  "property_id,address,city,state,zip_code,price,bedrooms,bathrooms,square_feet,amenities";

const sponsorColumns =
  "sponsor_id,name,url,status,active,placement,target_zip,radius_miles,distance_miles,tier,impressions,start_at,end_at";

const headers = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    const db = database();

    const [properties, sponsors] = await Promise.all([
      db
        .from("properties")
        .select(columns)
        .eq("approved", true)
        .order("property_id")
        .limit(100),

      db
        .from("sponsors")
        .select(sponsorColumns)
        .eq("status", "APPROVED")
        .eq("active", true)
        .order("sponsor_id")
        .limit(100),
    ]);

    if (properties.error || sponsors.error) {
      return NextResponse.json(
        { error: "Unable to load listings. Please try again." },
        { status: 503, headers },
      );
    }

    const validSponsors = (sponsors.data ?? [])
      .map((candidate) => sponsorSchema.safeParse(candidate))
      .filter((result) => result.success)
      .map((result) => result.data);

    const sponsorSelections = (properties.data ?? [])
      .map((property) =>
        selectSponsor(
          {
            propertyZip: property.zip_code,
            placement: "listing-results",
          },
          validSponsors,
        ),
      )
      .filter((sponsor) => sponsor !== null);

    const uniqueSponsors = Array.from(
      new Map(
        sponsorSelections.map((sponsor) => [
          sponsor.sponsor_id,
          sponsor,
        ]),
      ).values(),
    );

    return NextResponse.json(
      {
        properties: (properties.data ?? []).map((property) => ({
          ...property,
          price: Number(property.price),
          bathrooms: Number(property.bathrooms),
          local_sponsors: [],
        })),
        sponsors: uniqueSponsors,
      },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { error: "Listing service is unavailable." },
      { status: 503, headers },
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = request.headers.get("authorization");
    const match = auth?.match(/^Bearer (\S+)$/i);

    if (!match) {
      return NextResponse.json(
        { error: "Sign in to create a listing." },
        { status: 401, headers },
      );
    }

    const db = database(match[1]);
    const {
      data: { user },
      error: authError,
    } = await db.auth.getUser(match[1]);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired sign-in." },
        { status: 401, headers },
      );
    }

    if (!request.headers.get("content-type")?.includes("application/json")) {
      return NextResponse.json(
        { error: "Send application/json." },
        { status: 415, headers },
      );
    }

    const text = await request.text();

    if (new TextEncoder().encode(text).length > 16384) {
      return NextResponse.json(
        { error: "Request is too large." },
        { status: 413, headers },
      );
    }

    let body: unknown;

    try {
      body = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON." },
        { status: 400, headers },
      );
    }

    const parsed = propertyInput.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid listing fields." },
        { status: 400, headers },
      );
    }

    const { data, error } = await db
      .from("properties")
      .insert({ ...parsed.data, user_id: user.id })
      .select(columns)
      .single();

    if (error) {
      const status =
        error.code === "42501"
          ? 403
          : error.code === "23503"
            ? 409
            : 503;

      return NextResponse.json(
        {
          error:
            status === 409
              ? "Create your profile before adding a listing."
              : status === 403
                ? "This action is not permitted."
                : "Unable to create listing.",
        },
        { status, headers },
      );
    }

    return NextResponse.json(
      { property: data },
      { status: 201, headers },
    );
  } catch {
    return NextResponse.json(
      { error: "Listing service is unavailable." },
      { status: 503, headers },
    );
  }
}
