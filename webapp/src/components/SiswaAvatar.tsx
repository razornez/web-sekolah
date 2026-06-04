/**
 * SiswaAvatar — foto profil siswa kecil dengan fallback inisial.
 * Ringan: size sm=24px, md=32px, lg=40px. Lazy load gambar.
 */
export function SiswaAvatar({
  namaLengkap,
  foto,
  size = "sm",
  className = "",
}: {
  namaLengkap: string;
  foto?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dim = size === "sm" ? "h-6 w-6 text-[9px]" : size === "md" ? "h-8 w-8 text-[11px]" : "h-10 w-10 text-sm";
  const initials = namaLengkap
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  if (foto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={foto}
        alt={namaLengkap}
        loading="lazy"
        className={`${dim} shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  // Warna deterministik dari nama (konsisten, bukan random)
  let hash = 0;
  for (const c of namaLengkap) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffff;
  const COLORS = [
    "bg-indigo-200 text-indigo-800",
    "bg-emerald-200 text-emerald-800",
    "bg-amber-200 text-amber-800",
    "bg-rose-200 text-rose-800",
    "bg-sky-200 text-sky-800",
    "bg-violet-200 text-violet-800",
    "bg-teal-200 text-teal-800",
    "bg-orange-200 text-orange-800",
  ];
  const color = COLORS[hash % COLORS.length];

  return (
    <div
      className={`${dim} shrink-0 flex items-center justify-center rounded-full font-bold select-none ${color} ${className}`}
      title={namaLengkap}
    >
      {initials}
    </div>
  );
}
