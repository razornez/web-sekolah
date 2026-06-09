import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getLocale } from "@/i18n/locale";
import { getBerandaData, type TodoIcon, type T } from "./data";
import { CountUp } from "./CountUp";
import { OwlMascot } from "./OwlMascot";
import { TourGuide } from "./TourGuide";

const C = 2 * Math.PI * 50; // keliling donut r=50

function TodoIconSvg({ icon }: { icon: TodoIcon }) {
  switch (icon) {
    case "spp":
      return (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6 L10 11 L17 6" /><rect x="3" y="6" width="14" height="10" rx="1.5" /></svg>);
    case "ppdb":
      return (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="7" r="3" /><path d="M2 17 Q2 12 8 12 Q11 12 13 13" /><path d="M15 9 L15 14 M12.5 11.5 L17.5 11.5" /></svg>);
    case "bk":
      return (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2 L16 4 V9 Q16 14 10 18 Q4 14 4 9 V4 Z" /><path d="M10 8 L10 11 M10 13.4 L10 13.5" /></svg>);
    case "ujian":
      return (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14 L13 5 L16 8 L7 17 L3 18 Z" /><path d="M11 7 L14 10" /></svg>);
    case "perpus":
      return (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4 Q6 3 10 4 Q14 3 17 4 V16 Q14 15 10 16 Q6 15 3 16 Z" /><path d="M10 4 L10 16" /></svg>);
    default:
      return (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10 L9 15 L16 5" /></svg>);
  }
}

export async function BerandaAkadewa({ sekolahId, userName }: { sekolahId: number; userName: string }) {
  const tt = await getTranslations("dashboard");
  const locale = await getLocale();
  const t = tt as unknown as T;
  const d = await getBerandaData(sekolahId, userName, t, locale);
  const lavArc = (d.siswa.pctL / 100) * C;
  const pinkArc = (d.siswa.pctP / 100) * C;
  const agendaDekat = d.agenda[0]?.title ?? null;
  const cd = (days: number) => (days === 0 ? t("ak.cdToday") : days === 1 ? t("ak.cdTomorrow") : t("ak.cdDays", { n: days }));

  return (
    <>
      {/* ============== HERO ============== */}
      <section className="ak-hero">
        <div className="ak-hero-left">
          <div>
            <span className="ak-eyebrow">{d.heading.eyebrow}</span>
            <h1 className="ak-hero-title">{d.heading.greeting} <span className="ak-wave">👋</span></h1>
            <p className="ak-hero-sub">
              {tt.rich("ak.heroSub", {
                todos: d.todos.length,
                acts: d.activities.length,
                note: d.heading.note,
                b: (chunks) => <b>{chunks}</b>,
              })}
            </p>
          </div>
          <div className="ak-hero-actions">
            <Link href={d.todos[0]?.href ?? "/audit"} className="ak-btn ak-btn-primary">
              {t("ak.startToday")}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 7 L11 7 M7 3 L11 7 L7 11" /></svg>
            </Link>
            <Link href="/jadwal/peta" className="ak-btn ak-btn-soft">{t("ak.viewMap")}</Link>
          </div>
        </div>

        <div className="ak-hero-right">
          {d.kehadiranPct !== null && (
            <div className="ak-hero-score">
              <div className="ak-l">{t("ak.attendance")}</div>
              <div className="ak-v"><CountUp value={d.kehadiranPct} format="plain" /><span style={{ fontSize: 18, color: "var(--ak-muted)" }}>%</span></div>
              <div className="ak-d">{t("ak.attendanceToday")}</div>
            </div>
          )}
          <svg className="ak-desk" viewBox="0 0 400 280" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
              <linearGradient id="ak-deskG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E0A872" /><stop offset="100%" stopColor="#B07F4E" />
              </linearGradient>
            </defs>
            <g className="ak-desk-sun">
              <circle cx="60" cy="40" r="32" fill="#FFE69E" opacity="0.6" />
              <circle cx="60" cy="40" r="22" fill="#FFC76A" opacity="0.8" />
            </g>
            <g stroke="#FFE69E" strokeWidth="1" opacity="0.4">
              <line x1="60" y1="60" x2="180" y2="220" /><line x1="78" y1="58" x2="190" y2="225" /><line x1="50" y1="65" x2="170" y2="218" />
            </g>
            <rect x="20" y="20" width="120" height="100" rx="6" fill="none" stroke="#5B4FE9" strokeWidth="1.5" opacity="0.5" />
            <line x1="80" y1="20" x2="80" y2="120" stroke="#5B4FE9" strokeWidth="1" opacity="0.5" />
            <line x1="20" y1="70" x2="140" y2="70" stroke="#5B4FE9" strokeWidth="1" opacity="0.5" />
            <g className="ak-breathe">
              <path d="M180 130 Q180 110 170 105 Q175 100 180 110 Q188 95 200 105 Q193 115 200 120 Q210 110 215 120 Q210 135 195 132" fill="#2EA171" />
              <ellipse cx="190" cy="135" rx="14" ry="3" fill="#1A1830" opacity="0.2" />
              <path d="M178 135 L202 135 L198 158 L182 158 Z" fill="#E07650" />
              <ellipse cx="190" cy="135" rx="12" ry="3" fill="#FFB388" />
            </g>
            <rect x="0" y="200" width="400" height="100" fill="url(#ak-deskG)" />
            <line x1="0" y1="200" x2="400" y2="200" stroke="#1A1830" strokeWidth="1" opacity="0.2" />
            <g transform="translate(60,160)">
              <g stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7">
                <path className="ak-steam-1" d="M14 -5 Q11 -10 14 -16 Q17 -22 14 -28" />
                <path className="ak-steam-2" d="M24 -5 Q21 -10 24 -16 Q27 -22 24 -28" />
                <path className="ak-steam-3" d="M34 -5 Q31 -10 34 -16 Q37 -22 34 -28" />
              </g>
              <path d="M5 0 L43 0 L40 40 L8 40 Z" fill="#FCDDE8" />
              <ellipse cx="24" cy="0" rx="19" ry="4" fill="#D9558C" />
              <ellipse cx="24" cy="0" rx="15" ry="3" fill="#7C2851" />
              <path d="M43 8 Q56 10 56 22 Q56 34 43 32" fill="none" stroke="#D9558C" strokeWidth="4" strokeLinecap="round" />
              <path d="M19 18 Q19 14 22 14 Q24 14 24 16 Q24 14 26 14 Q29 14 29 18 Q29 21 24 24 Q19 21 19 18 Z" fill="#D9558C" />
            </g>
            <g transform="translate(150,170)">
              <rect x="0" y="0" width="120" height="80" rx="4" fill="#FFF" />
              <circle cx="10" cy="14" r="3" fill="#fff" stroke="#5B4FE9" strokeWidth="1.5" />
              <circle cx="10" cy="32" r="3" fill="#fff" stroke="#5B4FE9" strokeWidth="1.5" />
              <circle cx="10" cy="50" r="3" fill="#fff" stroke="#5B4FE9" strokeWidth="1.5" />
              <circle cx="10" cy="68" r="3" fill="#fff" stroke="#5B4FE9" strokeWidth="1.5" />
              <text x="20" y="20" fontFamily="Plus Jakarta Sans" fontSize="9" fontWeight="800" fill="#5B4FE9" letterSpacing="0.1em">{t("ak.deskNote")}</text>
              <line x1="20" y1="30" x2="110" y2="30" stroke="#1A1830" strokeWidth="0.6" opacity="0.2" />
              <line x1="20" y1="42" x2="100" y2="42" stroke="#1A1830" strokeWidth="0.6" opacity="0.2" />
              <line x1="20" y1="54" x2="105" y2="54" stroke="#1A1830" strokeWidth="0.6" opacity="0.2" />
              <rect x="22" y="34" width="6" height="6" rx="1" fill="none" stroke="#5B4FE9" strokeWidth="1" />
              <path d="M22 37 L25 39 L29 33" stroke="#2EA171" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="22" y="46" width="6" height="6" rx="1" fill="none" stroke="#5B4FE9" strokeWidth="1" />
              <rect x="22" y="58" width="6" height="6" rx="1" fill="none" stroke="#5B4FE9" strokeWidth="1" />
              <g className="ak-page-flip"><path d="M115 0 L120 0 L120 5 Q117 6 115 5 Z" fill="#F8F5FE" stroke="#5B4FE9" strokeWidth="0.8" opacity="0.8" /></g>
            </g>
            <g transform="translate(290,210) rotate(-12)">
              <rect x="0" y="0" width="100" height="6" fill="#FFE69E" />
              <path d="M100 0 L100 6 L108 3 Z" fill="#1A1830" />
              <rect x="0" y="0" width="14" height="6" fill="#E07650" />
            </g>
            <g transform="translate(295,140)" className="ak-breathe">
              <rect x="0" y="0" width="60" height="60" rx="2" fill="#FFE69E" />
              <text x="8" y="18" fontFamily="Plus Jakarta Sans" fontSize="8" fontWeight="700" fill="#C68A1C">{t("ak.deskAgenda")}</text>
              <text x="8" y="34" fontFamily="Plus Jakarta Sans" fontSize="13" fontWeight="800" fill="#1A1830">{t("ak.deskEvents", { n: d.agenda.length })}</text>
              <text x="8" y="50" fontFamily="Plus Jakarta Sans" fontSize="8" fontWeight="600" fill="#1A1830" opacity="0.7">{t("ak.deskThisWeek")}</text>
            </g>
          </svg>
        </div>
      </section>

      {/* ============== INSIGHT WIDGETS ============== */}
      <div className="ak-widgets">

        {/* 1. KOMPOSISI SISWA */}
        <div className="ak-w">
          <div className="ak-w-bg" aria-hidden="true"><svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" fill="#5B4FE9"><g fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700"><text x="20" y="40" fontSize="13">{d.siswa.total.toLocaleString(locale)}</text><text x="190" y="40" fontSize="13">Fase E · Fase F</text><text x="20" y="95" fontSize="12">L {d.siswa.L} ({d.siswa.pctL}%) : P {d.siswa.P} ({d.siswa.pctP}%)</text><text x="20" y="150" fontSize="13">Jenjang · Rombel · NISN</text><text x="20" y="205" fontSize="12">+{d.siswa.growth} · {d.tahun ?? ""}</text><text x="20" y="260" fontSize="12">Dapodik · Kurikulum Merdeka</text></g></svg></div>
          <div className="ak-w-head">
            <div>
              <div className="ak-w-tag">{t("ak.w1Tag")}</div>
              <div className="ak-w-title">{t("ak.w1Title")}</div>
            </div>
            <div className="ak-w-chip ak-lav">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="5" r="2.5" /><path d="M3 14 Q3 10 8 10 Q13 10 13 14" /></svg>
            </div>
          </div>
          <div className="ak-w-big"><CountUp value={d.siswa.total} /></div>
          <div className="ak-w-sub">{d.siswa.growth > 0 ? t("ak.growthUp", { n: d.siswa.growth }) : t("ak.growthNone")}</div>

          <div className="ak-divider ak-lav" />
          <div className="ak-donut-row">
            <div className="ak-donut">
              <svg viewBox="0 0 130 130">
                <circle cx="65" cy="65" r="50" fill="none" stroke="#EEEBFF" strokeWidth="18" />
                <circle cx="65" cy="65" r="50" fill="none" stroke="#5B4FE9" strokeWidth="18" strokeDasharray={`${lavArc} ${C}`} transform="rotate(-90 65 65)" />
                <circle cx="65" cy="65" r="50" fill="none" stroke="#D9558C" strokeWidth="18" strokeDasharray={`${pinkArc} ${C}`} strokeDashoffset={-lavArc} transform="rotate(-90 65 65)" />
              </svg>
              <div className="ak-center">
                <div className="ak-ln">L · P</div>
                <div className="ak-vn">{d.siswa.pctL} : {d.siswa.pctP}</div>
              </div>
            </div>
            <div className="ak-legend">
              <div className="ak-lg"><span className="ak-sw ak-lk" /><span>{t("ak.male")}</span><span className="ak-num">{d.siswa.L.toLocaleString(locale)}</span><span className="ak-pct">{d.siswa.pctL}%</span></div>
              <div className="ak-lg"><span className="ak-sw ak-pr" /><span>{t("ak.female")}</span><span className="ak-num">{d.siswa.P.toLocaleString(locale)}</span><span className="ak-pct">{d.siswa.pctP}%</span></div>
              <div className="ak-lg" style={{ marginTop: 4, paddingTop: 8, borderTop: "1px dashed var(--ak-rule-2)" }}><span /><span style={{ fontSize: 11, color: "var(--ak-muted)" }}>{d.siswa.balanced ? t("ak.ratioBalanced") : t("ak.ratioSkewed")}</span><span /><span /></div>
            </div>
          </div>

          {d.siswa.jenjang.length > 0 && (
            <div className="ak-jenjang">
              {d.siswa.jenjang.map((j) => (
                <div className="ak-jrow" key={j.nama}>
                  <div className="ak-nm">{j.nama}</div>
                  <div className="ak-jbar">
                    <div className="ak-lk" style={{ width: `${j.total ? (j.L / j.total) * 100 : 0}%` }} />
                    <div className="ak-pr" style={{ width: `${j.total ? (j.P / j.total) * 100 : 0}%` }} />
                  </div>
                  <div className="ak-total">{j.total}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. TIM GURU & PTK */}
        <div className="ak-w">
          <div className="ak-w-bg" aria-hidden="true"><svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" fill="#2EA171"><g fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700"><text x="20" y="40" fontSize="13">{d.guru.total} PTK</text><text x="20" y="95" fontSize="12">A · B · C</text><text x="20" y="150" fontSize="12">Lintas Minat · Mulok</text><text x="20" y="205" fontSize="12">Wali kelas {d.guru.waliCount}</text><text x="20" y="260" fontSize="12">NUPTK · Dapodik</text></g></svg></div>
          <div className="ak-w-head">
            <div>
              <div className="ak-w-tag">{t("ak.w2Tag")}</div>
              <div className="ak-w-title">{t("ak.w2Title")}</div>
            </div>
            <div className="ak-w-chip ak-mint">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="6" r="2" /><circle cx="11" cy="6" r="2" /><path d="M2 13 Q2 10 5 10 Q7 10 8 10.5" /><path d="M14 13 Q14 10 11 10 Q9 10 8 10.5" /></svg>
            </div>
          </div>
          <div className="ak-w-big"><CountUp value={d.guru.total} /></div>
          <div className="ak-w-sub">{d.guru.markedGuru > 0 ? t("ak.guruPresence", { hadir: d.guru.hadir, pct: d.guru.guruHadirPct }) : t("ak.guruNoPresence")}</div>

          <div className="ak-divider ak-mint" />
          {d.guru.depts.length > 0 ? (
            <div className="ak-grouping">
              {d.guru.depts.map((dep) => (
                <div className="ak-dept" key={dep.label}>
                  <div className="ak-nm"><span className="ak-sw" style={{ background: dep.color }} /><span className="ak-txt">{dep.label}</span></div>
                  <div className="ak-deptbar"><div className="ak-fill" style={{ width: `${dep.pct}%`, background: dep.color }} /></div>
                  <div className="ak-num">{dep.value}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ak-empty">{t("ak.guruNoMapel")}</div>
          )}
          <div className="ak-dept-foot">
            <span>{t("ak.waliActive")}</span>
            <span><b>{d.guru.waliCount}</b> {t("ak.waliOf", { t: d.guru.total })}</span>
          </div>
        </div>

        {/* 3. AGENDA MENDATANG */}
        <div className="ak-w">
          <div className="ak-w-bg" aria-hidden="true"><svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" fill="#D9558C"><g fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700"><text x="20" y="40" fontSize="13">Sen · Sel · Rab · Kam · Jum</text><text x="20" y="95" fontSize="12">Ujian · UTS · UAS</text><text x="20" y="150" fontSize="12">SPP · PPDB · Rapor</text><text x="20" y="205" fontSize="12">{d.tahun ?? "Kalender"}</text></g></svg></div>
          <div className="ak-w-head">
            <div>
              <div className="ak-w-tag">{t("ak.w3Tag")}</div>
              <div className="ak-w-title">{t("ak.w3Title", { n: d.agenda.length })}</div>
            </div>
            <div className="ak-w-chip ak-pink">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="12" height="11" rx="1.5" /><path d="M2 6 L14 6 M5 1 L5 4 M11 1 L11 4" /></svg>
            </div>
          </div>

          <div className="ak-divider ak-pink" />
          {d.agenda.length > 0 ? (
            <div className="ak-agenda">
              {d.agenda.map((e, i) => (
                <div className={`ak-evt ${e.soon ? "ak-soon" : "ak-later"}`} key={i}>
                  <div className="ak-tt">{e.title}</div>
                  <div className="ak-ss"><span className="ak-cd">{cd(e.days)}</span><span>{e.when}</span></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ak-empty">{t("ak.agendaEmpty")}</div>
          )}
        </div>
      </div>

      {/* ============== LOWER — Tasks + Activity ============== */}
      <div className="ak-lower">
        <div className="ak-panel ak-dark">
          <div className="ak-panel-bg" aria-hidden="true"><svg viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice" fill="#FFFFFF"><g fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="800"><text x="20" y="50" fontSize="22">!</text><text x="60" y="40" fontSize="12">PRIORITAS</text><text x="200" y="50" fontSize="18">★</text><text x="290" y="50" fontSize="14">→ AKSI</text><text x="20" y="130" fontSize="16">#1</text><text x="200" y="130" fontSize="20">●</text><text x="250" y="135" fontSize="14">URGENT</text><text x="20" y="220" fontSize="16">#2</text><text x="170" y="220" fontSize="12">SEGERA</text><text x="20" y="290" fontSize="16">#3</text><text x="190" y="285" fontSize="14">→ →</text><text x="330" y="285" fontSize="14">TODO</text></g></svg></div>
          <div className="ak-panel-h">
            <h3>{t("ak.todoPanelTitle")}</h3>
            <span className="ak-meta">{t("ak.todoCount", { n: d.todos.length })}</span>
          </div>
          {d.todos.length > 0 ? (
            <div className="ak-todo">
              {d.todos.map((todo) => (
                <Link href={todo.href} className="ak-todo-item" key={todo.title}>
                  <div className={`ak-todo-icon ak-${todo.color}`}><TodoIconSvg icon={todo.icon} /></div>
                  <div className="ak-todo-text"><div className="ak-t">{todo.title}</div><div className="ak-s">{todo.sub}</div></div>
                  <div className="ak-todo-arr"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 3 L9 7 L5 11" /></svg></div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="ak-empty" style={{ color: "rgba(255,255,255,0.7)" }}>{t("ak.todoAllClear")}</div>
          )}
        </div>

        <div className="ak-panel">
          <div className="ak-panel-bg" aria-hidden="true"><svg viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice" fill="#5B4FE9"><g fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700"><text x="20" y="45" fontSize="12">~3m</text><text x="170" y="50" fontSize="12">LIVE</text><text x="320" y="50" fontSize="14">● ●</text><text x="20" y="125" fontSize="18">▸</text><text x="230" y="125" fontSize="12">SPP</text><text x="20" y="215" fontSize="12">presensi</text><text x="180" y="215" fontSize="12">nilai</text><text x="30" y="290" fontSize="12">+24m</text><text x="200" y="285" fontSize="12">PPDB</text></g></svg></div>
          <div className="ak-panel-h">
            <h3>{t("ak.activityTitle")}</h3>
            <span className="ak-meta-live">{t("ak.live")}</span>
          </div>
          {d.activities.length > 0 ? (
            <div className="ak-ticker">
              {d.activities.map((a, i) => (
                <div className="ak-trow" key={i}>
                  <div className={`ak-tav ak-${a.color}`}>{a.initials}</div>
                  <div className="ak-tmsg"><b>{a.name}</b> {a.rest}{a.ctx && <span className="ak-ctx">{a.ctx}</span>}</div>
                  <div className="ak-ttime">{a.time}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ak-empty">{t("ak.activityEmpty")}</div>
          )}
        </div>
      </div>

      <OwlMascot siswa={d.siswa.total.toLocaleString(locale)} guru={d.guru.total} agendaDekat={agendaDekat} todos={d.todos.length} sppDue={d.counts.sppDue} />
      <TourGuide siswa={d.siswa.total.toLocaleString(locale)} guru={d.guru.total} agendaCount={d.agenda.length} todos={d.todos.length} />
    </>
  );
}
