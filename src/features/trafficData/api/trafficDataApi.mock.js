const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20260301);

const SEGMENTS = Array.from({ length: 22 }).map((_, i) => {
  const id = `S${String(i + 1).padStart(2, "0")}`;
  const base = 20000 + Math.floor(rng() * 120000);
  return {
    id,
    name: `Road segment ${i + 1} name`,
    records: base,
  };
});

const totalRecords = SEGMENTS.reduce((s, x) => s + x.records, 0);

export async function fetchRoadSegmentsSummary() {
  await sleep(250);
  return { totalRecords, segments: SEGMENTS };
}

export async function fetchFrequentCongestionSegments() {
  await sleep(250);
  // mock "congested level"
  const items = SEGMENTS.slice(0, 12).map((s) => ({
    segmentId: s.id,
    name: s.name,
    // 0..1 (frequently congested)
    congestionScore: Math.min(1, 0.25 + rng() * 0.85),
  }));
  items.sort((a, b) => b.congestionScore - a.congestionScore);
  return { items };
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export async function fetchSegmentStats({ segmentId, date }) {
  await sleep(280);

  const seed = hashString(`${segmentId}-${date}`);
  const r = mulberry32(seed);

  // 24 giờ: speed, flow (bar-ish)
  const hours = Array.from({ length: 24 }).map((_, h) => h);
  const speed = hours.map((h) => Math.max(5, 25 + 15 * Math.sin(h / 3) + (r() - 0.5) * 6));
  const flow = hours.map((h) => Math.max(0, 200 + 160 * Math.sin((h - 2) / 2.8) + (r() - 0.5) * 60));

  // donut: ratio trạng thái
  const normal = 0.45 + r() * 0.25;
  const slow = 0.2 + r() * 0.2;
  const jam = Math.max(0.05, 1 - normal - slow);

  return {
    segmentId,
    date,
    hours,
    series: {
      speed, // km/h
      flow,  // vehicles
    },
    distribution: {
      normal,
      slow,
      jam,
    },
    summary: {
      avgSpeed: speed.reduce((a, b) => a + b, 0) / speed.length,
      maxFlow: Math.max(...flow),
      jamHours: Math.round(jam * 24),
    },
  };
}