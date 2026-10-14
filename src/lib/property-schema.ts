import { z } from "zod";

export const propertyInput = z.object({
  address: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(100),
  state: z.string().regex(/^[A-Z]{2}$/),
  zip_code: z.string().regex(/^[0-9]{5}$/),
  price: z.number().finite().min(0).max(9999999999.99)
    .refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 0.0001),
  bedrooms: z.number().int().min(0).max(30),
  bathrooms: z.number().finite().min(0).max(30)
    .refine(value => Math.abs(value * 10 - Math.round(value * 10)) < 0.0001),
  square_feet: z.number().int().positive().max(2147483647),
  amenities: z.array(z.string().trim().min(1).max(100)).max(30).default([]),
}).strict();