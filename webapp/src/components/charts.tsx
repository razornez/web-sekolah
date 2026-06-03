// Komponen chart ringan tanpa dependency (server-renderable).

export function BarList({
  title,
  data,
  suffix,
  barClass = "bg-gray-900",
}: {
  title: string;
  data: { label: string; value: number }[];
  suffix?: string;
  barClass?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 text-sm font-medium text-gray-700">{title}</div>
      <div className="space-y-2">
        {data.length === 0 && <p className="text-sm text-gray-400">Tidak ada data.</p>}
        {data.map((d) => (
          <div key={d.label}>
            <div className="mb-0.5 flex justify-between text-xs text-gray-600">
              <span className="truncate pr-2">{d.label}</span>
              <span className="font-medium text-gray-900">
                {d.value.toLocaleString("id-ID")}{suffix ?? ""}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100">
              <div className={`h-2 rounded-full ${barClass}`} style={{ width: `${(d.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Donut({
  title,
  data,
}: {
  title: string;
  data: { label: string; value: number; color: string }[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let acc = 0;
  const stops = data
    .filter((d) => d.value > 0)
    .map((d) => {
      const start = total ? (acc / total) * 100 : 0;
      acc += d.value;
      const end = total ? (acc / total) * 100 : 0;
      return `${d.color} ${start}% ${end}%`;
    })
    .join(", ");
  const bg = total ? `conic-gradient(${stops})` : "#e5e7eb";

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 text-sm font-medium text-gray-700">{title}</div>
      <div className="flex items-center gap-4">
        <div className="relative h-28 w-28 shrink-0 rounded-full" style={{ background: bg }}>
          <div className="absolute inset-[14px] rounded-full bg-white" />
        </div>
        <ul className="space-y-1 text-sm">
          {data.map((d) => (
            <li key={d.label} className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-sm" style={{ background: d.color }} />
              <span className="text-gray-600">{d.label}</span>
              <span className="font-medium text-gray-900">{d.value.toLocaleString("id-ID")}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
