"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const PIN_HTML = `
  <svg xmlns="http://www.w3.org/2000/svg" width="33" height="36" viewBox="-2 -8 60 72" fill="none" aria-hidden="true">
    <path d="M14 16 A 14 14 0 0 1 42 16" stroke="#555555" stroke-width="2.2" stroke-linecap="round" fill="none" opacity="0.55"></path>
    <path d="M8 14 A 20 20 0 0 1 48 14" stroke="#4D8B6F" stroke-width="2.2" stroke-linecap="round" fill="none"></path>
    <path d="M28 54 C 28 54, 16 38, 16 26 A 12 12 0 0 1 40 26 C 40 38, 28 54, 28 54 Z" stroke="#555555" stroke-width="2.6" fill="none" stroke-linejoin="round"></path>
    <circle cx="28" cy="26" r="3.6" fill="#4D8B6F"></circle>
  </svg>
`;

function ClickToEnableScrollZoom() {
  const map = useMap();

  useEffect(() => {
    map.scrollWheelZoom.disable();
    const enable = () => map.scrollWheelZoom.enable();
    map.on("click", enable);
    return () => {
      map.off("click", enable);
    };
  }, [map]);

  return null;
}

export default function BuildingMapInner({
  latitude,
  longitude,
  name,
}: {
  latitude: number;
  longitude: number;
  name: string;
}) {
  const icon = useMemo(
    () =>
      L.divIcon({
        className: "rr-building-pin",
        html: PIN_HTML,
        iconSize: [33, 36],
        iconAnchor: [16.5, 36],
      }),
    []
  );

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  return (
    <div className="w-full">
      <div
        className="overflow-hidden h-[220px] md:h-[280px]"
        style={{ borderRadius: 14, border: "1px solid #E2D9CE" }}
      >
        <MapContainer
          center={[latitude, longitude]}
          zoom={17}
          scrollWheelZoom={false}
          style={{ width: "100%", height: "100%" }}
          attributionControl
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors &copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <Marker position={[latitude, longitude]} icon={icon} title={name} />
          <ClickToEnableScrollZoom />
        </MapContainer>
      </div>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-2 text-xs font-semibold"
        style={{ color: "#4D8B6F" }}
      >
        Open in Google Maps
      </a>
    </div>
  );
}
