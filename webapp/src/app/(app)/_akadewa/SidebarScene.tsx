"use client";

import { useEffect, useState } from "react";

/**
 * Ilustrasi scene custom untuk tiap menu sidebar (BUKAN icon library).
 * Kelas ak-fp/ak-fs/ak-ac/ak-i dipakai global CSS untuk recolor saat tile aktif.
 */

function JadwalClock() {
  // Sepenuhnya declarative (transform via prop) — TIDAK mutasi DOM langsung,
  // supaya tidak memicu "children should not have changed" di React 19/DevTools.
  const [deg, setDeg] = useState({ h: 0, m: 0 });

  useEffect(() => {
    const compute = () => {
      const now = new Date();
      const h = now.getHours() % 12;
      const m = now.getMinutes();
      const s = now.getSeconds();
      return { h: h * 30 + m * 0.5, m: m * 6 + s * 0.1 };
    };
    const raf = requestAnimationFrame(() => setDeg(compute()));
    const id = setInterval(() => setDeg(compute()), 1000);
    return () => { cancelAnimationFrame(raf); clearInterval(id); };
  }, []);

  return (
    <svg viewBox="0 0 38 38" fill="none">
      <circle cx="19" cy="19" r="14" className="ak-fs" fill="#E5DFFD" />
      <circle cx="19" cy="19" r="14" className="ak-i" stroke="#5B4FE9" strokeWidth="2" fill="none" />
      <line x1="19" y1="7" x2="19" y2="9" className="ak-i" stroke="#5B4FE9" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="19" y1="29" x2="19" y2="31" className="ak-i" stroke="#5B4FE9" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="7" y1="19" x2="9" y2="19" className="ak-i" stroke="#5B4FE9" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="29" y1="19" x2="31" y2="19" className="ak-i" stroke="#5B4FE9" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="19" y1="19" x2="19" y2="12" className="ak-i" stroke="#1A1830" strokeWidth="2.4" strokeLinecap="round" transform={`rotate(${deg.h} 19 19)`} />
      <line x1="19" y1="19" x2="19" y2="9" className="ak-i" stroke="#5B4FE9" strokeWidth="1.8" strokeLinecap="round" transform={`rotate(${deg.m} 19 19)`} />
      <circle cx="19" cy="19" r="2" className="ak-ac" fill="#E07650" />
    </svg>
  );
}

export function SidebarScene({ scene }: { scene: string }) {
  switch (scene) {
    case "beranda":
      return (
        <svg viewBox="0 0 38 38" fill="none">
          <circle cx="29" cy="9" r="3" className="ak-ac" fill="#FFE69E" />
          <path d="M6 22 L19 11 L32 22 L32 32 L6 32 Z" className="ak-fp" fill="#5B4FE9" />
          <path d="M19 11 L32 22 L32 32 L19 32 Z" fill="#3B2FA6" opacity="0.3" />
          <rect x="16" y="24" width="6" height="8" fill="#FFE69E" rx="1" />
          <rect x="9" y="22" width="5" height="4" fill="#DCEAFB" rx="0.5" />
        </svg>
      );
    case "siswa":
      return (
        <svg viewBox="0 0 38 38" fill="none">
          <circle cx="13" cy="14" r="6" className="ak-fp" fill="#5B4FE9" />
          <circle cx="25" cy="14" r="6" className="ak-fs" fill="#B5A8F5" />
          <circle cx="19" cy="24" r="6" className="ak-fp" fill="#7E6FE8" />
          <path d="M5 32 Q5 26 13 26 Q21 26 21 32" className="ak-i" stroke="#5B4FE9" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M17 32 Q17 26 25 26 Q33 26 33 32" className="ak-i" stroke="#7E6FE8" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      );
    case "guru":
      return (
        <svg viewBox="0 0 38 38" fill="none">
          <rect x="6" y="6" width="20" height="14" rx="1.5" fill="#2EA171" />
          <rect x="6" y="6" width="20" height="14" rx="1.5" fill="none" stroke="#1A1830" strokeWidth="1" opacity="0.3" />
          <line x1="9" y1="11" x2="20" y2="11" stroke="#fff" strokeWidth="1" />
          <line x1="9" y1="14" x2="17" y2="14" stroke="#fff" strokeWidth="1" />
          <circle cx="20" cy="26" r="4" className="ak-fp" fill="#5B4FE9" />
          <path d="M11 36 Q11 30 20 30 Q29 30 29 36" className="ak-i" stroke="#5B4FE9" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <line x1="29" y1="26" x2="34" y2="22" stroke="#E07650" strokeWidth="2" strokeLinecap="round" className="ak-pencil-sway" />
        </svg>
      );
    case "jadwal":
      return <JadwalClock />;
    case "absensi":
      return (
        <svg viewBox="0 0 38 38" fill="none">
          <circle cx="19" cy="19" r="14" className="ak-fs" fill="#D4F1E2" />
          <circle cx="19" cy="19" r="14" stroke="#2EA171" strokeWidth="3.5" fill="none" strokeDasharray="84 87.96" strokeDashoffset="0" transform="rotate(-90 19 19)" strokeLinecap="round" />
          <path d="M13 19 L17 23 L25 14" className="ak-i" stroke="#1A1830" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "rapor":
      return (
        <svg viewBox="0 0 38 38" fill="none">
          <path d="M9 6 L25 6 L31 12 L31 32 Q31 33 30 33 L9 33 Q8 33 8 32 L8 7 Q8 6 9 6 Z" className="ak-fs" fill="#FFE2D1" />
          <path d="M25 6 L25 12 L31 12" className="ak-i" stroke="#1A1830" strokeWidth="1.4" fill="none" opacity="0.4" />
          <line x1="13" y1="16" x2="26" y2="16" className="ak-i" stroke="#1A1830" strokeWidth="1.4" opacity="0.4" />
          <line x1="13" y1="20" x2="22" y2="20" className="ak-i" stroke="#1A1830" strokeWidth="1.4" opacity="0.4" />
          <path d="M19 22 L21 26 L25 26.5 L22 29 L23 33 L19 31 L15 33 L16 29 L13 26.5 L17 26 Z" className="ak-ac" fill="#FFE69E" stroke="#C68A1C" strokeWidth="0.6" />
        </svg>
      );
    case "keuangan":
      return (
        <svg viewBox="0 0 38 38" fill="none">
          <ellipse cx="19" cy="14" rx="9" ry="2.5" className="ak-fs" fill="#FFC76A" />
          <path d="M10 14 L10 17 Q10 19 19 19 Q28 19 28 17 L28 14" className="ak-fs" fill="#C68A1C" />
          <ellipse cx="19" cy="14" rx="9" ry="2.5" fill="#FFE69E" />
          <ellipse cx="19" cy="22" rx="11" ry="2.8" className="ak-ac" fill="#E07650" />
          <ellipse cx="19" cy="22" rx="11" ry="2.8" fill="#FFB388" />
          <ellipse cx="19" cy="30" rx="13" ry="3" className="ak-fp" fill="#5B4FE9" />
          <ellipse cx="19" cy="30" rx="13" ry="3" fill="#7E6FE8" />
        </svg>
      );
    case "ujian":
      return (
        <svg viewBox="0 0 38 38" fill="none">
          <rect x="6" y="6" width="20" height="26" rx="2" className="ak-fs" fill="#DCEAFB" />
          <circle cx="12" cy="13" r="2" className="ak-i" stroke="#3E7BC9" strokeWidth="1.4" fill="none" />
          <circle cx="12" cy="13" r="1" className="ak-fp" fill="#3E7BC9" />
          <line x1="16" y1="13" x2="23" y2="13" className="ak-i" stroke="#3E7BC9" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="12" cy="19" r="2" className="ak-i" stroke="#3E7BC9" strokeWidth="1.4" fill="none" />
          <line x1="16" y1="19" x2="21" y2="19" className="ak-i" stroke="#3E7BC9" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="12" cy="25" r="2" className="ak-i" stroke="#3E7BC9" strokeWidth="1.4" fill="none" />
          <line x1="16" y1="25" x2="23" y2="25" className="ak-i" stroke="#3E7BC9" strokeWidth="1.4" strokeLinecap="round" />
          <g className="ak-pencil-sway">
            <rect x="27" y="6" width="3.5" height="20" fill="#FFE69E" rx="0.5" transform="rotate(15 28.75 16)" />
            <path d="M27 6 L30.5 6 L31 10 L26.5 10 Z" fill="#E07650" transform="rotate(15 28.75 8)" />
            <path d="M26.5 24 L31 24 L28.75 28 Z" fill="#1A1830" transform="rotate(15 28.75 26)" />
          </g>
        </svg>
      );
    case "laporan":
      return (
        <svg viewBox="0 0 38 38" fill="none">
          <line x1="8" y1="32" x2="32" y2="32" className="ak-i" stroke="#1A1830" strokeWidth="1.4" strokeLinecap="round" opacity="0.4" />
          <line x1="8" y1="32" x2="8" y2="8" className="ak-i" stroke="#1A1830" strokeWidth="1.4" strokeLinecap="round" opacity="0.4" />
          <rect x="11" y="22" width="4" height="10" rx="1" className="ak-fs" fill="#E5DFFD" />
          <rect x="17" y="18" width="4" height="14" rx="1" className="ak-fs" fill="#FFE2D1" />
          <rect x="23" y="13" width="4" height="19" rx="1" className="ak-fs" fill="#D4F1E2" />
          <rect x="29" y="9" width="4" height="23" rx="1" className="ak-fp" fill="#5B4FE9" />
          <path d="M13 24 L19 20 L25 15 L31 11" className="ak-i" stroke="#1A1830" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.5" />
          <circle cx="31" cy="11" r="1.6" className="ak-ac" fill="#E07650" />
        </svg>
      );
    case "pengaturan":
      return (
        <svg viewBox="0 0 38 38" fill="none">
          <path d="M19 4 L21.5 4 L22.4 8.2 Q24 8.8 25.4 9.8 L29.4 8.2 L31.6 12 L28.4 14.8 Q28.6 16.4 28.4 18 L31.6 20.8 L29.4 24.6 L25.4 23 Q24 24 22.4 24.6 L21.5 28.8 L19 28.8 L16.5 28.8 L15.6 24.6 Q14 24 12.6 23 L8.6 24.6 L6.4 20.8 L9.6 18 Q9.4 16.4 9.6 14.8 L6.4 12 L8.6 8.2 L12.6 9.8 Q14 8.8 15.6 8.2 L16.5 4 Z" className="ak-fp" fill="#5B4FE9" />
          <circle cx="19" cy="16.4" r="5" className="ak-fs" fill="#E5DFFD" />
          <circle cx="19" cy="16.4" r="2.4" className="ak-ac" fill="#FFE69E" />
        </svg>
      );
    case "vote":
      return (
        <svg viewBox="0 0 38 38" fill="none">
          <rect x="7" y="17" width="24" height="15" rx="2" className="ak-fp" fill="#5B4FE9" />
          <path d="M7 21 L31 21" className="ak-i" stroke="#3B2FA6" strokeWidth="1.2" opacity="0.4" />
          <rect x="16" y="19" width="6" height="2.4" rx="1" fill="#1A1830" opacity="0.5" />
          <rect x="13" y="5" width="12" height="14" rx="1.5" className="ak-fs" fill="#FFE2D1" transform="rotate(-8 19 12)" />
          <path d="M15 11 L18 14 L23 8" stroke="#2EA171" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" transform="rotate(-8 19 12)" />
        </svg>
      );
    case "pengumuman":
      return (
        <svg viewBox="0 0 38 38" fill="none">
          <path d="M8 16 L22 10 L22 28 L8 22 Z" className="ak-fp" fill="#5B4FE9" />
          <rect x="22" y="13" width="6" height="12" rx="3" className="ak-fs" fill="#B5A8F5" />
          <path d="M11 22 L11 29 L15 29 L14 22 Z" className="ak-i" fill="#7E6FE8" />
          <circle cx="30" cy="11" r="2" className="ak-ac" fill="#FFE69E" />
        </svg>
      );
    case "rombel":
      return (
        <svg viewBox="0 0 38 38" fill="none">
          <rect x="6" y="8" width="26" height="22" rx="3" className="ak-fs" fill="#E5DFFD" />
          <circle cx="13" cy="16" r="2.6" className="ak-fp" fill="#5B4FE9" />
          <circle cx="25" cy="16" r="2.6" className="ak-fp" fill="#7E6FE8" />
          <circle cx="13" cy="24" r="2.6" className="ak-fp" fill="#7E6FE8" />
          <circle cx="25" cy="24" r="2.6" className="ak-ac" fill="#E07650" />
        </svg>
      );
    case "mapel":
      return (
        <svg viewBox="0 0 38 38" fill="none">
          <path d="M6 9 Q14 6 19 9 L19 30 Q14 27 6 30 Z" className="ak-fp" fill="#5B4FE9" />
          <path d="M32 9 Q24 6 19 9 L19 30 Q24 27 32 30 Z" className="ak-fs" fill="#B5A8F5" />
          <line x1="19" y1="9" x2="19" y2="30" className="ak-i" stroke="#3B2FA6" strokeWidth="1.2" opacity="0.5" />
        </svg>
      );
    case "bk":
      return (
        <svg viewBox="0 0 38 38" fill="none">
          <path d="M19 6 L31 10 L31 19 Q31 28 19 33 Q7 28 7 19 L7 10 Z" className="ak-fp" fill="#5B4FE9" />
          <path d="M19 14 Q19 11 22 11 Q24 11 24 13 Q24 16 19 19 Q14 16 14 13 Q14 11 16 11 Q19 11 19 14 Z" className="ak-ac" fill="#FCDDE8" />
        </svg>
      );
    case "perpustakaan":
      return (
        <svg viewBox="0 0 38 38" fill="none">
          <rect x="8" y="9" width="6" height="22" rx="1" className="ak-fp" fill="#5B4FE9" />
          <rect x="15" y="11" width="6" height="20" rx="1" className="ak-fs" fill="#7E6FE8" />
          <rect x="22" y="8" width="6" height="23" rx="1" className="ak-ac" fill="#E07650" />
          <rect x="22" y="8" width="6" height="23" rx="1" fill="#FFB388" />
        </svg>
      );
    case "ppdb":
      return (
        <svg viewBox="0 0 38 38" fill="none">
          <rect x="9" y="7" width="16" height="24" rx="2" className="ak-fs" fill="#DCEAFB" />
          <rect x="13" y="14" width="8" height="10" rx="4" className="ak-fp" fill="#3E7BC9" />
          <path d="M27 16 L33 16 M30 13 L30 19" className="ak-ac" stroke="#E07650" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );
    case "tugas":
      return (
        <svg viewBox="0 0 38 38" fill="none">
          <rect x="9" y="8" width="20" height="24" rx="2.5" className="ak-fs" fill="#E5DFFD" />
          <rect x="14" y="6" width="10" height="5" rx="2" className="ak-fp" fill="#5B4FE9" />
          <path d="M13 18 L16 21 L21 15" className="ak-i" stroke="#2EA171" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="13" y1="26" x2="25" y2="26" className="ak-i" stroke="#7E6FE8" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "prestasi":
      return (
        <svg viewBox="0 0 38 38" fill="none">
          <path d="M12 8 L26 8 L26 16 Q26 22 19 22 Q12 22 12 16 Z" className="ak-fp" fill="#5B4FE9" />
          <path d="M12 10 Q7 10 7 14 Q7 17 11 17" className="ak-i" stroke="#7E6FE8" strokeWidth="2" fill="none" />
          <path d="M26 10 Q31 10 31 14 Q31 17 27 17" className="ak-i" stroke="#7E6FE8" strokeWidth="2" fill="none" />
          <rect x="16" y="22" width="6" height="5" className="ak-fs" fill="#B5A8F5" />
          <rect x="12" y="27" width="14" height="4" rx="1" className="ak-ac" fill="#FFE69E" />
        </svg>
      );
    case "surat":
      return (
        <svg viewBox="0 0 38 38" fill="none">
          <rect x="6" y="10" width="26" height="18" rx="2.5" className="ak-fs" fill="#FFE2D1" />
          <path d="M6 12 L19 21 L32 12" className="ak-i" stroke="#E07650" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "sarpras":
      return (
        <svg viewBox="0 0 38 38" fill="none">
          <path d="M19 7 L30 13 L30 25 L19 31 L8 25 L8 13 Z" className="ak-fp" fill="#5B4FE9" />
          <path d="M19 7 L30 13 L19 19 L8 13 Z" className="ak-fs" fill="#B5A8F5" />
          <path d="M19 19 L19 31 L8 25 L8 13 Z" fill="#3B2FA6" opacity="0.3" />
        </svg>
      );
    case "jurnal":
      return (
        <svg viewBox="0 0 38 38" fill="none">
          <rect x="9" y="7" width="20" height="24" rx="2" className="ak-fs" fill="#D4F1E2" />
          <rect x="9" y="7" width="5" height="24" rx="2" className="ak-fp" fill="#2EA171" />
          <line x1="17" y1="14" x2="26" y2="14" className="ak-i" stroke="#2EA171" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="17" y1="19" x2="26" y2="19" className="ak-i" stroke="#56C098" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="17" y1="24" x2="23" y2="24" className="ak-i" stroke="#56C098" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "lainnya":
      return (
        <svg viewBox="0 0 38 38" fill="none">
          <rect x="7" y="7" width="10" height="10" rx="2.5" className="ak-fp" fill="#5B4FE9" />
          <rect x="21" y="7" width="10" height="10" rx="2.5" className="ak-fs" fill="#B5A8F5" />
          <rect x="7" y="21" width="10" height="10" rx="2.5" className="ak-fs" fill="#FFE2D1" />
          <rect x="21" y="21" width="10" height="10" rx="2.5" className="ak-ac" fill="#FFE69E" />
        </svg>
      );
    default: {
      // Fallback berwarna — variasi berdasarkan nama agar tiap menu tetap khas (label tetap tampil).
      const PAL = [
        ["#5B4FE9", "#E5DFFD"], ["#2EA171", "#D4F1E2"], ["#3E7BC9", "#DCEAFB"],
        ["#E07650", "#FFE2D1"], ["#D9558C", "#FCDDE8"], ["#C68A1C", "#FFE69E"], ["#7E6FE8", "#E5DFFD"],
      ];
      let h = 0;
      for (let i = 0; i < scene.length; i++) h = (h * 31 + scene.charCodeAt(i)) >>> 0;
      const [ink, soft] = PAL[h % PAL.length];
      const shape = h % 3;
      return (
        <svg viewBox="0 0 38 38" fill="none">
          <rect x="6" y="6" width="26" height="26" rx="9" className="ak-fs" fill={soft} />
          {shape === 0 && <circle cx="19" cy="19" r="6" className="ak-fp" fill={ink} />}
          {shape === 1 && <rect x="13" y="13" width="12" height="12" rx="3" className="ak-fp" fill={ink} />}
          {shape === 2 && <path d="M19 12 L26 25 L12 25 Z" className="ak-fp" fill={ink} />}
        </svg>
      );
    }
  }
}
