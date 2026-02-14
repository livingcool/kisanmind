// components/LocationInput.tsx - Location input with automatic reverse geocoding

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/translations';
import { Loader2, Info, Search, Navigation } from 'lucide-react';
import { debounce, isValidCoordinates } from '@/lib/utils';
import { AddressDetails, GeocodingResult, Coordinates } from '@/lib/location-types';

interface LocationInputProps {
  coordinates: Coordinates | null;
  address: string;
  onCoordinatesChange: (coords: Coordinates | null) => void;
  onAddressChange: (address: string) => void;
  onAddressDetailsChange: (details: AddressDetails | null) => void;
  error?: string;
}

// Dynamically import LocationMap to avoid SSR issues with Leaflet
import dynamic from 'next/dynamic';
const LocationMap = dynamic(() => import('./LocationMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[300px] bg-gray-100 rounded-xl">
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
    </div>
  ),
});

export default function LocationInput({
  coordinates,
  address,
  onCoordinatesChange,
  onAddressChange,
  onAddressDetailsChange,
  error,
  addressDetails,
}: LocationInputProps & { addressDetails?: AddressDetails | null }) {
  const { t } = useTranslation();

  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [searchInput, setSearchInput] = useState(address);

  // Rate limiting: Track last API call time
  const [lastApiCall, setLastApiCall] = useState<number>(0);
  const MIN_API_DELAY = 1000; // 1 second between calls (Nominatim requirement)

  /**
   * Reverse geocode: Convert coordinates to address
   */
  const reverseGeocode = async (lat: number, lon: number) => {
    // Rate limiting check
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCall;
    if (timeSinceLastCall < MIN_API_DELAY) {
      await new Promise((resolve) =>
        setTimeout(resolve, MIN_API_DELAY - timeSinceLastCall)
      );
    }

    setIsReverseGeocoding(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'KisanMind/1.0 (Agricultural Advisory App)',
          },
        }
      );

      setLastApiCall(Date.now());

      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const data: GeocodingResult = await response.json();

      // Extract address details
      const details: AddressDetails = data.address || {};

      // Build formatted address string
      const addressParts = [
        details.road,
        details.suburb || details.neighbourhood,
        details.city || details.town || details.village,
        details.district || details.county,
        details.state,
        details.postcode,
      ].filter(Boolean);

      const formattedAddress = addressParts.join(', ') || data.display_name;

      onAddressChange(formattedAddress);
      onAddressDetailsChange(details);
      setSearchInput(formattedAddress);
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      // Fallback to coordinates only
      onAddressChange(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      onAddressDetailsChange(null);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  /**
   * Forward geocode: Convert address search to coordinates
   */
  const forwardGeocode = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Rate limiting check
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCall;
    if (timeSinceLastCall < MIN_API_DELAY) {
      await new Promise((resolve) =>
        setTimeout(resolve, MIN_API_DELAY - timeSinceLastCall)
      );
    }

    setIsGeocodingAddress(true);

    try {
      // Add India bias to search for better results
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&addressdetails=1&countrycodes=in&limit=1`,
        {
          headers: {
            'User-Agent': 'KisanMind/1.0 (Agricultural Advisory App)',
          },
        }
      );

      setLastApiCall(Date.now());

      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const data: GeocodingResult[] = await response.json();

      if (data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);

        if (isValidCoordinates(lat, lon)) {
          onCoordinatesChange({ lat, lon });

          // Extract and set address details
          const details: AddressDetails = result.address || {};
          onAddressDetailsChange(details);

          // Build formatted address
          const addressParts = [
            details.road,
            details.suburb || details.neighbourhood,
            details.city || details.town || details.village,
            details.district || details.county,
            details.state,
            details.postcode,
          ].filter(Boolean);

          const formattedAddress = addressParts.join(', ') || result.display_name;
          onAddressChange(formattedAddress);
          setSearchInput(formattedAddress);
        }
      } else {
        console.warn('No geocoding results found');
      }
    } catch (error) {
      console.error('Forward geocoding error:', error);
    } finally {
      setIsGeocodingAddress(false);
    }
  };

  // Debounced forward geocoding for search input
  const debouncedForwardGeocode = useCallback(
    debounce((query: string) => forwardGeocode(query), 1000),
    []
  );

  /**
   * Handle current location button click
   */
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        onCoordinatesChange({ lat, lon });
        reverseGeocode(lat, lon);
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsGettingLocation(false);
      }
    );
  };

  /**
   * Handle manual coordinate input
   * Format: "lat, lon" or "lat,lon"
   */
  const handleCoordinateInput = (input: string) => {
    setSearchInput(input);

    // Try to parse coordinates from input
    const coordPattern = /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/;
    const match = input.trim().match(coordPattern);

    if (match) {
      const lat = parseFloat(match[1]);
      const lon = parseFloat(match[2]);

      if (isValidCoordinates(lat, lon)) {
        onCoordinatesChange({ lat, lon });
        // Automatically reverse geocode when coordinates are entered
        reverseGeocode(lat, lon);
        return;
      }
    }

    // If not coordinates, trigger address search
    if (input.trim().length > 3) {
      debouncedForwardGeocode(input);
    }
  };

  /**
   * Handle map location selection
   */
  const handleMapSelect = (lat: number, lon: number) => {
    onCoordinatesChange({ lat, lon });
    reverseGeocode(lat, lon);
  };

  /**
   * Auto-reverse geocode when coordinates change externally
   */
  useEffect(() => {
    if (coordinates && !address) {
      reverseGeocode(coordinates.lat, coordinates.lon);
    }
  }, [coordinates?.lat, coordinates?.lon]);

  const isLoading = isGettingLocation || isGeocodingAddress || isReverseGeocoding;

  return (
    <div>
      <label
        htmlFor="location"
        className="block text-base font-semibold text-gray-900 mb-2"
      >
        {t('input.location')} <span className="text-red-500">*</span>
      </label>

      <div className="flex gap-2">
        {/* Search/Coordinate Input */}
        <div className="flex-1 relative">
          <input
            id="location"
            type="text"
            value={searchInput}
            onChange={(e) => handleCoordinateInput(e.target.value)}
            placeholder={t('input.locationPlaceholder')}
            className="w-full min-h-touch pl-10 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-primary-600" />
          )}
        </div>

        {/* Current Location Button */}
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isGettingLocation}
          className="min-w-touch min-h-touch px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 flex items-center justify-center"
          aria-label="Get current location"
        >
          {isGettingLocation ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Navigation className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {/* Helper Text */}
      <p className="mt-1 text-sm text-gray-500 flex items-center gap-1">
        <Info className="w-4 h-4" />
        {t('input.locationHelper')}
      </p>

      {/* Full Address (if no detailed breakdown available) */}
      {!addressDetails && address && (
        <div className="mb-4 bg-white rounded-lg p-4 border border-green-200">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Address:</span> {address}
          </p>
          {coordinates && (
            <p className="text-sm text-gray-600 mt-2">
              <span className="font-semibold">Coordinates:</span>{' '}
              {coordinates.lat.toFixed(6)}, {coordinates.lon.toFixed(6)}
            </p>
          )}
        </div>
      )}

      {/* Map Preview - Always Visible */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {coordinates ? 'Selected Location' : 'Select Location on Map'}
        </label>
        <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200">
          <LocationMap
            coordinates={coordinates || { lat: 20.5937, lon: 78.9629 }} // Default to India center
            address={coordinates ? address : undefined}
            height="300px"
            showSatellite={false}
            zoom={coordinates ? 15 : 5}
            onLocationSelect={handleMapSelect}
          />
          <p className="text-xs text-gray-500 mt-2 p-1 text-center bg-gray-50">
            {coordinates ? 'Tap elsewhere to change location' : 'Tap on map to pin your farm location'}
          </p>
        </div>
      </div>

      {/* Loading Status */}
      {isReverseGeocoding && (
        <p className="mt-2 text-sm text-primary-600 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Fetching location details...
        </p>
      )}

      {isGeocodingAddress && (
        <p className="mt-2 text-sm text-primary-600 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Searching location...
        </p>
      )}
    </div>
  );
}

/**
 * Usage example:
 *
 * import LocationInput from '@/components/LocationInput';
 *
 * const [coordinates, setCoordinates] = useState(null);
 * const [address, setAddress] = useState('');
 * const [addressDetails, setAddressDetails] = useState(null);
 *
 * <LocationInput
 *   coordinates={coordinates}
 *   address={address}
 *   onCoordinatesChange={setCoordinates}
 *   onAddressChange={setAddress}
 *   onAddressDetailsChange={setAddressDetails}
 *   error={errors.location}
 * />
 */
