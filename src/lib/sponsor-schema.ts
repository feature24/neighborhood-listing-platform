import { z } from "zod";

function isIpAddress(hostname: string): boolean {
  const ipv4 =
    /^(?:\d{1,3}\.){3}\d{1,3}$/;

  const ipv6 =
    hostname.includes(":");

  return ipv4.test(hostname) || ipv6;
}

export const sponsorUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, {
    message: "Sponsor URL must use HTTPS.",
  })
  .refine((value) => {
    try {
      return !isIpAddress(new URL(value).hostname);
    } catch {
      return false;
    }
  }, {
    message: "Sponsor URL cannot use a raw IP address.",
  });

export const sponsorSchema = z.object({
  sponsor_id: z.string().min(1),
  name: z.string().min(1),
  url: sponsorUrlSchema,
  status: z.enum(["APPROVED", "PENDING", "REJECTED"]),
  active: z.boolean(),
  placement: z.string().min(1),
  target_zip: z.string().regex(/^\d{5}$/),
  radius_miles: z.number().nonnegative(),
  distance_miles: z.number().nonnegative(),
  tier: z.enum(["SILVER", "GOLD", "PLATINUM"]),
  impressions: z.number().int().nonnegative(),
  start_at: z.string(),
  end_at: z.string(),
});
