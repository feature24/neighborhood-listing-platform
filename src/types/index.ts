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

export interface Sponsor {
  sponsor_id: string;
  name: string;
  url: string;
}

export interface PropertySponsor {
  property_id: string;
  sponsor_id: string;
}