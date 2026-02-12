// lib/location-types.ts - Type definitions for location and geocoding

/**
 * Address details from reverse geocoding (Nominatim)
 */
export interface AddressDetails {
  road?: string;
  suburb?: string;
  neighbourhood?: string;
  city?: string;
  town?: string;
  village?: string;
  district?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
}

/**
 * Geocoding result from Nominatim API
 */
export interface GeocodingResult {
  lat: string;
  lon: string;
  display_name: string;
  address: AddressDetails;
  type?: string;
  importance?: number;
  class?: string;
}

/**
 * Coordinates interface
 */
export interface Coordinates {
  lat: number;
  lon: number;
}

/**
 * Location with full details
 */
export interface LocationData {
  coordinates?: Coordinates;
  address?: string;
  addressDetails?: AddressDetails;
}
