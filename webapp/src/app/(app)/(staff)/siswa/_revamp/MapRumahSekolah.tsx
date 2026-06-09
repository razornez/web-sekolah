"use client";

import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const makeIcon = (cls: string, emoji: string) =>
  L.divIcon({ html: `<span class="ak-pin ${cls}"><span class="ak-pin-ring"></span><span class="ak-pin-dot">${emoji}</span></span>`, className: "", iconSize: [34, 34], iconAnchor: [17, 17] });
const homeIcon = makeIcon("ak-pin-home", "🏠");
const schoolIcon = makeIcon("ak-pin-school", "🏫");

export default function MapRumahSekolah({ sLat, sLng, schLat, schLng, route, homeLabel, schoolLabel }: {
  sLat: number; sLng: number; schLat: number; schLng: number;
  route: [number, number][] | null; homeLabel: string; schoolLabel: string;
}) {
  const bounds = L.latLngBounds([[sLat, sLng], [schLat, schLng]]).pad(0.35);
  const line: [number, number][] = route ?? [[sLat, sLng], [schLat, schLng]];
  return (
    <MapContainer bounds={bounds} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false} attributionControl={false} zoomControl>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Polyline positions={line} pathOptions={{ color: "#5B4FE9", weight: 3.5, dashArray: "10 7", lineCap: "round", className: "ak-route" }} />
      <Marker position={[schLat, schLng]} icon={schoolIcon}><Tooltip direction="top" offset={[0, -14]}>{schoolLabel}</Tooltip></Marker>
      <Marker position={[sLat, sLng]} icon={homeIcon}><Tooltip direction="top" offset={[0, -14]}>{homeLabel}</Tooltip></Marker>
    </MapContainer>
  );
}
