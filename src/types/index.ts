export interface Property {
  property_id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  amenities: string[];
  local_sponsors: string[];
}

export type SponsorStatus = "APPROVED" | "PENDING" | "REJECTED";
export type SponsorTier = "SILVER" | "GOLD" | "PLATINUM";

export interface Sponsor {
  sponsor_id: string;
  name: string;
  url: string;
  status: SponsorStatus;
  active: boolean;
  placement: string;
  target_zip: string;
  radius_miles: number;
  distance_miles: number;
  tier: SponsorTier;
  impressions: number;
  start_at: string;
  end_at: string;
}

export interface PropertySponsor {
  property_id: string;
  sponsor_id: string;
}
