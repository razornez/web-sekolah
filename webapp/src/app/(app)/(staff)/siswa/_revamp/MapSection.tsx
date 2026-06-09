"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const Map = dynamic(() => import("./MapRumahSekolah"), {
  ssr: false,
  loading: () => <div className="ak-map-skel" />,
});

type Geo = { sLat: number; sLng: number; schLat: number; schLng: number };

export function MapSection({ geo, distanceKm, alamat, transportasi, tinggalDengan }: {
  geo: Geo | null; distanceKm: number | null; alamat: string | null; transportasi: string | null; tinggalDengan: string | null;
}) {
  const t = useTranslations("siswa");
  const [route, setRoute] = useState<[number, number][] | null>(null);
  const [osrm, setOsrm] = useState<{ km: number; min: number } | null>(null);

  useEffect(() => {
    if (!geo) return;
    let alive = true;
    (async () => {
      try {
        const r = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${geo.sLng},${geo.sLat};${geo.schLng},${geo.schLat}?overview=full&geometries=geojson`,
          { signal: AbortSignal.timeout(6000) },
        );
        const d = await r.json();
        const rt = d?.routes?.[0];
        if (rt && alive) {
          setRoute((rt.geometry.coordinates as [number, number][]).map(([lon, lat]) => [lat, lon]));
          setOsrm({ km: Math.round(rt.distance / 100) / 10, min: Math.max(1, Math.round(rt.duration / 60)) });
        }
      } catch { /* fallback ke garis lurus + haversine */ }
    })();
    return () => { alive = false; };
  }, [geo]);

  const km = osrm?.km ?? distanceKm;
  const mnt = osrm?.min ?? (distanceKm != null ? Math.max(3, Math.round((distanceKm / 22) * 60)) : null);
  // Estimasi jam berangkat/pulang dari waktu tempuh + jam sekolah standar (06:45 tiba · 14:30 pulang)
  const fmtJam = (m: number) => `${String(Math.floor((((m % 1440) + 1440) % 1440) / 60)).padStart(2, "0")}:${String(((m % 60) + 60) % 60).padStart(2, "0")}`;
  const TIBA_SEK = 6 * 60 + 45, PULANG_SEK = 14 * 60 + 30;
  const jam = mnt != null ? { berangkat: fmtJam(TIBA_SEK - mnt), sampai: fmtJam(TIBA_SEK), pulang: fmtJam(PULANG_SEK), tiba: fmtJam(PULANG_SEK + mnt) } : null;

  return (
    <div className="map-grid">
      <div className="map-canvas ak-map-canvas">
        {geo ? (
          <Map sLat={geo.sLat} sLng={geo.sLng} schLat={geo.schLat} schLng={geo.schLng} route={route} homeLabel={t("detail.mapHome")} schoolLabel={t("detail.mapSchool")} />
        ) : (
          <>
            <svg className="map-route" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M20 70 L40 70 L40 40 L80 40 L80 30" fill="none" stroke="var(--ak-primary)" strokeWidth="1.5" strokeDasharray="4 2" /></svg>
            <span className="map-pin" style={{ left: "20%", top: "70%" }}>🏠</span>
            <span className="map-pin" style={{ left: "80%", top: "30%", fontSize: 24 }}>🏫</span>
          </>
        )}
        {km != null && <span className="map-dist">{km} km</span>}
      </div>
      <div className="map-info">
        <div className="mi-addr">📍 {alamat ?? t("detail.addrNone")}</div>
        <div className="map-stats">
          <div className="mst"><div className="k">{t("detail.jarak")}</div><div className="v">{km != null ? `${km} km` : "—"}</div></div>
          <div className="mst"><div className="k">{t("detail.estTempuh")}</div><div className="v">{mnt != null ? t("detail.mnt", { n: mnt }) : "—"}</div></div>
          <div className="mst"><div className="k">{t("detail.tinggalDengan")}</div><div className="v" style={{ fontSize: 13 }}>{tinggalDengan ?? "—"}</div></div>
          <div className="mst"><div className="k">{t("detail.transportasi")}</div><div className="v" style={{ fontSize: 13 }}>{transportasi ?? "—"}</div></div>
          {jam && <>
            <div className="mst"><div className="k">{t("detail.mBerangkat")}</div><div className="v">{jam.berangkat}</div><div className="msub">{t("detail.mSampai", { t: jam.sampai })}</div></div>
            <div className="mst"><div className="k">{t("detail.mPulang")}</div><div className="v">{jam.pulang}</div><div className="msub">{t("detail.mTiba", { t: jam.tiba })}</div></div>
          </>}
        </div>
        <div className="map-transport">
          {transportasi ? t("detail.transUse", { mode: transportasi.toLowerCase() }) : t("detail.transNone")}
          {km != null ? t("detail.transDist", { km }) : ""}.{osrm && ` ${t("detail.viaRoad")}`}
        </div>
      </div>
    </div>
  );
}
