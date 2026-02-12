// components/MandiMap.tsx - Interactive map showing nearby mandis

'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import { MapPin, Navigation, TrendingUp } from 'lucide-react';
import { MandiLocation } from '@/lib/api';
import { formatDistance, formatCurrency } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

interface MandiMapProps {
  farmerLocation: {
    lat: number;
    lon: number;
  };
  mandis: MandiLocation[];
  className?: string;
}

// Fix Leaflet default marker icon issue in Next.js
const createCustomIcon = (color: string) => {
  return new Icon({
    iconUrl: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='${encodeURIComponent(
      color
    )}' stroke='white' stroke-width='2'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const farmerIcon = createCustomIcon('#16a34a');
const mandiIcon = createCustomIcon('#dc2626');

// Component to recenter map when location changes
function MapController({ center }: { center: LatLngExpression }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
}

export default function MandiMap({
  farmerLocation,
  mandis,
  className = '',
}: MandiMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const center: LatLngExpression = [farmerLocation.lat, farmerLocation.lon];

  // Get navigation URL for Google Maps
  const getNavigationUrl = (mandi: MandiLocation) => {
    return `https://www.google.com/maps/dir/?api=1&origin=${farmerLocation.lat},${farmerLocation.lon}&destination=${mandi.coordinates.lat},${mandi.coordinates.lon}`;
  };

  // Don't render on server side
  if (!isClient) {
    return (
      <div className={`w-full h-96 bg-gray-200 rounded-lg animate-pulse ${className}`}>
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <MapContainer
        center={center}
        zoom={10}
        className="w-full h-96 rounded-lg shadow-lg z-0"
        scrollWheelZoom={false}
      >
        <MapController center={center} />

        {/* Map Tiles - Using OpenStreetMap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Farmer's Location Marker */}
        <Marker position={center} icon={farmerIcon}>
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold text-green-800 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Your Location
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {farmerLocation.lat.toFixed(4)}, {farmerLocation.lon.toFixed(4)}
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Mandi Markers */}
        {mandis.map((mandi) => (
          <Marker
            key={mandi.id}
            position={[mandi.coordinates.lat, mandi.coordinates.lon]}
            icon={mandiIcon}
          >
            <Popup>
              <div className="p-3 min-w-[200px]">
                <h3 className="font-bold text-red-800 mb-2">{mandi.name}</h3>
                <p className="text-sm text-gray-600 mb-1">
                  {mandi.district}, {mandi.state}
                </p>

                {mandi.distance && (
                  <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                    <Navigation className="w-3 h-3" />
                    {formatDistance(mandi.distance)} away
                  </p>
                )}

                {/* Current Prices */}
                {mandi.currentPrices && mandi.currentPrices.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Current Prices:
                    </p>
                    {mandi.currentPrices.map((price, idx) => (
                      <p key={idx} className="text-xs text-gray-600">
                        {price.commodity}: {formatCurrency(price.price)}/
                        {price.unit}
                      </p>
                    ))}
                  </div>
                )}

                {/* Navigation Button */}
                <a
                  href={getNavigationUrl(mandi)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                >
                  <Navigation className="w-3 h-3" />
                  Get Directions
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend */}
      <div className="mt-4 flex flex-wrap gap-4 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-600 rounded-full"></div>
          <span className="text-gray-700">Your Location</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-red-600 rounded-full"></div>
          <span className="text-gray-700">Market (Mandi)</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Usage example:
 *
 * import MandiMap from '@/components/MandiMap';
 *
 * const farmerLocation = { lat: 20.9, lon: 77.75 };
 * const mandis = [
 *   {
 *     id: '1',
 *     name: 'Akola Mandi',
 *     district: 'Akola',
 *     state: 'Maharashtra',
 *     coordinates: { lat: 20.7, lon: 77.0 },
 *     distance: 15.2,
 *     currentPrices: [
 *       { commodity: 'Cotton', price: 6500, unit: 'quintal', date: '2026-02-12' }
 *     ]
 *   }
 * ];
 *
 * <MandiMap farmerLocation={farmerLocation} mandis={mandis} />
 */
