const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const baseRng = mulberry32(20260303);

const SEGMENTS = Array.from({ length: 20 }).map((_, i) => ({
  id: `S${String(i + 1).padStart(2, "0")}`,
  name: i === 0 ? "3 tháng 2" : i === 1 ? "Tô Hiến Thành" : `Road segment ${i + 1}`,
  lat: 10.77 + (baseRng() - 0.5) * 0.12,
  lng: 106.69 + (baseRng() - 0.5) * 0.12,
}));

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export async function fetchSegments() {
  await sleep(200);
  return SEGMENTS;
}

export async function fetchAffectedList(segmentId) {
  await sleep(260);

  const seed = hashString(segmentId) + 99;
  const rng = mulberry32(seed);

  const others = SEGMENTS.filter((s) => s.id !== segmentId);

  const items = others
    .map((s) => {
      const p = rng();
      const level = p > 0.72 ? "High" : p > 0.42 ? "Medium" : "Low";
      return {
        segmentId: s.id,
        name: s.name,
        level,
        score: p,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  return { items };
}

export async function fetchSpreadMapData(segmentId) {
  await sleep(260);

  // data for future map overlay (circles/arrows) – mock only
  const seed = hashString(`spread-${segmentId}`) + 7;
  const rng = mulberry32(seed);

  const center = SEGMENTS.find((s) => s.id === segmentId) || SEGMENTS[0];

  const rings = [0.3, 0.6, 0.9].map((k, idx) => ({
    radiusKm: (idx + 1) * 0.8,
    intensity: k,
  }));

  const arrows = Array.from({ length: 6 }).map((_, i) => ({
    from: { lat: center.lat, lng: center.lng },
    to: {
      lat: center.lat + (rng() - 0.5) * 0.06,
      lng: center.lng + (rng() - 0.5) * 0.06,
    },
    weight: 0.4 + rng() * 0.6,
  }));

  return { center, rings, arrows };
}