// Kalkulasi persona dari tanggal lahir & biometri — tanpa library eksternal.

export type Zodiak = { name: string; sym: string; desc: string; tags: string[]; el: string };

const ZODIAKS: (Zodiak & { start: [number, number] })[] = [
  { name: "Capricorn", sym: "♑", el: "Tanah", desc: "Disiplin, sabar, dan ambisius. Tekun mengejar tujuan jangka panjang.", tags: ["Tekun", "Realistis", "Mandiri"], start: [12, 22] },
  { name: "Aquarius", sym: "♒", el: "Udara", desc: "Independen, inovatif, dan humanis. Suka ide-ide baru yang tak biasa.", tags: ["Visioner", "Kreatif", "Sosial"], start: [1, 20] },
  { name: "Pisces", sym: "♓", el: "Air", desc: "Empatik, kreatif, dan tenang. Sukar mengungkap perasaan tapi peka pada suasana.", tags: ["Ekspresif", "Empati tinggi", "Imajinatif"], start: [2, 19] },
  { name: "Aries", sym: "♈", el: "Api", desc: "Berani, energik, dan pemimpin alami. Tak takut memulai hal baru.", tags: ["Berani", "Pelopor", "Spontan"], start: [3, 21] },
  { name: "Taurus", sym: "♉", el: "Tanah", desc: "Sabar, gigih, dan setia. Menghargai stabilitas dan keindahan.", tags: ["Gigih", "Setia", "Tenang"], start: [4, 20] },
  { name: "Gemini", sym: "♊", el: "Udara", desc: "Cerdas, komunikatif, dan ingin tahu. Cepat beradaptasi dan luwes bergaul.", tags: ["Komunikatif", "Lincah", "Penasaran"], start: [5, 21] },
  { name: "Cancer", sym: "♋", el: "Air", desc: "Hangat, perhatian, dan protektif. Sangat menghargai keluarga & rasa aman.", tags: ["Penyayang", "Setia", "Intuitif"], start: [6, 21] },
  { name: "Leo", sym: "♌", el: "Api", desc: "Percaya diri, murah hati, dan karismatik. Senang tampil dan memimpin.", tags: ["Karismatik", "Percaya diri", "Loyal"], start: [7, 23] },
  { name: "Virgo", sym: "♍", el: "Tanah", desc: "Teliti, analitis, dan rapi. Perfeksionis yang suka membantu dengan detail.", tags: ["Teliti", "Analitis", "Rapi"], start: [8, 23] },
  { name: "Libra", sym: "♎", el: "Udara", desc: "Adil, ramah, dan diplomatis. Mencari harmoni dan keseimbangan.", tags: ["Diplomatis", "Adil", "Ramah"], start: [9, 23] },
  { name: "Scorpio", sym: "♏", el: "Air", desc: "Intens, fokus, dan penuh tekad. Setia dan mendalam dalam segala hal.", tags: ["Tekad kuat", "Fokus", "Mendalam"], start: [10, 23] },
  { name: "Sagittarius", sym: "♐", el: "Api", desc: "Optimis, petualang, dan jujur. Cinta kebebasan dan pengetahuan baru.", tags: ["Optimis", "Petualang", "Jujur"], start: [11, 22] },
];

export function zodiakFromDate(d: Date): Zodiak {
  const m = d.getMonth() + 1, day = d.getDate();
  for (let i = ZODIAKS.length - 1; i >= 0; i--) {
    const [zm, zd] = ZODIAKS[i].start;
    if (m > zm || (m === zm && day >= zd)) {
      const z = ZODIAKS[i];
      return { name: z.name, sym: z.sym, desc: z.desc, tags: z.tags, el: z.el };
    }
  }
  const z = ZODIAKS[0]; // Capricorn (akhir Des → awal Jan)
  return { name: z.name, sym: z.sym, desc: z.desc, tags: z.tags, el: z.el };
}

const NUMERO_SIFAT: Record<number, { sifat: string; tags: string[] }> = {
  1: { sifat: "pemimpin — mandiri, berinisiatif, dan tegas.", tags: ["Pemimpin", "Mandiri", "Tegas"] },
  2: { sifat: "diplomat — peka, kooperatif, dan penyeimbang.", tags: ["Diplomatis", "Peka", "Sabar"] },
  3: { sifat: "kreatif — ekspresif, ceria, dan komunikatif.", tags: ["Ekspresif", "Kreatif", "Optimis"] },
  4: { sifat: "pekerja keras — teratur, andal, dan membumi.", tags: ["Disiplin", "Andal", "Teratur"] },
  5: { sifat: "petualang — dinamis, bebas, dan adaptif.", tags: ["Dinamis", "Adaptif", "Berani"] },
  6: { sifat: "pengasuh — bertanggung jawab, hangat, dan harmonis.", tags: ["Penyayang", "Tanggung jawab", "Harmonis"] },
  7: { sifat: "pemikir — analitis, reflektif, dan mendalam.", tags: ["Analitis", "Reflektif", "Bijak"] },
  8: { sifat: "ambisius — terorganisir, percaya diri, dan berorientasi hasil.", tags: ["Ambisius", "Percaya diri", "Strategis"] },
  9: { sifat: "humanis — murah hati, idealis, dan penuh empati.", tags: ["Humanis", "Idealis", "Empati"] },
};

export function numerologi(d: Date): { angka: number; sifat: string; tags: string[] } {
  const s = `${d.getDate()}${d.getMonth() + 1}${d.getFullYear()}`;
  let n = s.split("").reduce((a, b) => a + Number(b), 0);
  while (n > 9) n = String(n).split("").reduce((a, b) => a + Number(b), 0);
  const e = NUMERO_SIFAT[n] ?? NUMERO_SIFAT[1];
  return { angka: n, sifat: e.sifat, tags: e.tags };
}

export type Bmi = { value: number; kategori: "Kurus" | "Normal" | "Gemuk" | "Obesitas"; pct: number };

export function bmi(tinggiCm: number, beratKg: number): Bmi | null {
  if (!tinggiCm || !beratKg || tinggiCm < 50) return null;
  const v = beratKg / Math.pow(tinggiCm / 100, 2);
  let kategori: Bmi["kategori"] = "Normal";
  if (v < 18.5) kategori = "Kurus";
  else if (v >= 25 && v < 30) kategori = "Gemuk";
  else if (v >= 30) kategori = "Obesitas";
  // posisi pointer di meter 0..100 (rentang 14..36 dipetakan)
  const pct = Math.max(0, Math.min(100, ((v - 14) / (36 - 14)) * 100));
  return { value: Math.round(v * 10) / 10, kategori, pct };
}
