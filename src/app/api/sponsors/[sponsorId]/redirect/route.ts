import { NextResponse } from "next/server";
import { database } from "@/lib/database";
import { sponsorUrlSchema } from "@/lib/sponsor-schema";

interface RouteContext {
  params: Promise<{
    sponsorId: string;
  }>;
}

function errorResponse(
  code: string,
  message: string,
  status: number,
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status },
  );
}

export async function GET(
  request: Request,
  context: RouteContext,
) {
  try {
    const { sponsorId } = await context.params;
    const db = database();

    const { data: sponsor, error } = await db
      .from("sponsors")
      .select("sponsor_id,url,status,active,start_at,end_at")
      .eq("sponsor_id", sponsorId)
      .eq("status", "APPROVED")
      .eq("active", true)
      .single();

    if (error || !sponsor) {
      return errorResponse(
        "SPONSOR_NOT_AVAILABLE",
        "Sponsor destination is not available.",
        404,
      );
    }

    const now = new Date();
    const start = new Date(sponsor.start_at);
    const end = new Date(sponsor.end_at);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      now < start ||
      now > end
    ) {
      return errorResponse(
        "SPONSOR_NOT_ACTIVE",
        "Sponsor campaign is not active.",
        410,
      );
    }

    const validatedUrl =
      sponsorUrlSchema.safeParse(sponsor.url);

    if (!validatedUrl.success) {
      return errorResponse(
        "UNSAFE_SPONSOR_URL",
        "Sponsor destination must be a valid HTTPS URL using a hostname.",
        400,
      );
    }

    const approvedDestination =
      new URL(validatedUrl.data);

    const requestUrl = new URL(request.url);

    const suppliedDestination =
      requestUrl.searchParams.get("destination");

    if (suppliedDestination) {
      const suppliedValidation =
        sponsorUrlSchema.safeParse(suppliedDestination);

      if (!suppliedValidation.success) {
        return errorResponse(
          "UNSAFE_SPONSOR_URL",
          "Sponsor destination must be a valid HTTPS URL using a hostname.",
          400,
        );
      }

      if (
        new URL(suppliedValidation.data).href !==
        approvedDestination.href
      ) {
        return errorResponse(
          "DESTINATION_MISMATCH",
          "Requested destination does not match the approved sponsor URL.",
          400,
        );
      }
    }

    return NextResponse.redirect(
      approvedDestination,
      { status: 302 },
    );
  } catch {
    return errorResponse(
      "SPONSOR_REDIRECT_ERROR",
      "Unable to open sponsor destination.",
      503,
    );
  }
}
