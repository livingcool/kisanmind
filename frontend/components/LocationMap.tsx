// components/LocationMap.tsx - Interactive map component for location display

'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationMapProps {
  coordinates: { lat: number; lon: number };
  address?: string;
  height?: string;
  showSatellite?: boolean;
  zoom?: number;
  onLocationSelect?: (lat: number, lon: number) => void;
}

export default function LocationMap({
  coordinates,
  address,
  height = '300px',
  showSatellite = false,
  zoom = 13,
  onLocationSelect,
}: LocationMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    // Destroy existing map if it exists
    if (mapRef.current) {
      mapRef.current.remove();
    }

    // Create custom marker icon (green pin for agricultural theme)
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="position: relative;">
          <div style="
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
            border: 3px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          "></div>
          <div style="
            position: absolute;
            top: 6px;
            left: 6px;
            width: 14px;
            height: 14px;
            background: white;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: [coordinates.lat, coordinates.lon],
      zoom: zoom,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    mapRef.current = map;

    // Add tile layer (street or satellite)
    if (showSatellite) {
      // Satellite imagery from Esri
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 18,
      }).addTo(map);

      // Add labels overlay
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        attribution: '',
        maxZoom: 18,
      }).addTo(map);
    } else {
      // Standard street map from OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
    }

    // Add marker
    const marker = L.marker([coordinates.lat, coordinates.lon], {
      icon: customIcon,
    }).addTo(map);

    // Handle map clicks
    if (onLocationSelect) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      });

      // Change cursor to pointer to indicate interactivity
      map.getContainer().style.cursor = 'crosshair';
    }

    // Add popup with address if provided
    if (address) {
      marker.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px;">
          <strong style="color: #16a34a; font-size: 14px;">Your Farm Location</strong>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #4b5563;">${address}</p>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #9ca3af;">
            ${coordinates.lat.toFixed(4)}, ${coordinates.lon.toFixed(4)}
          </p>
        </div>
      `).openPopup();
    }

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [coordinates.lat, coordinates.lon, address, showSatellite, zoom, onLocationSelect]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden' }}
      className="shadow-md border-2 border-gray-200 z-0"
    />
  );
}

/**
 * Usage example:
 *
 * import LocationMap from '@/components/LocationMap';
 *
 * <LocationMap
 *   coordinates={{ lat: 20.5937, lon: 78.9629 }}
 *   address="Vidarbha, Maharashtra"
 *   height="400px"
 *   showSatellite={true}
 *   zoom={15}
 * />
 */
