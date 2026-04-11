const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20260302);

const SEGMENTS = Array.from({ length: 18 }).map((_, i) => ({
  id: `S${String(i + 1).padStart(2, "0")}`,
  name: `Road segment ${i + 1} name`,
  // mock location (HCM-ish)
  lat: 10.77 + (rng() - 0.5) * 0.12,
  lng: 106.69 + (rng() - 0.5) * 0.12,
}));

export async function fetchSegments() {
  await sleep(200);
  return SEGMENTS;
}

export async function fetchAffectedSegments(segmentId) {
  await sleep(220);

  const base = SEGMENTS.filter((s) => s.id !== segmentId);
  const items = base
    .map((s) => ({
      segmentId: s.id,
      name: s.name,
      impact: Math.min(1, 0.25 + rng() * 0.75),
    }))
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 8);

  return { items };
}

export async function fetchCorrelationMatrix(segmentId) {
  await sleep(280);

  // Build small matrix (12x12) with seed by segmentId
  const seed = segmentId.split("").reduce((s, c) => s + c.charCodeAt(0), 0) + 77;
  const r = mulberry32(seed);

  const ids = SEGMENTS.slice(0, 12).map((s) => s.id);
  const values = ids.map(() => ids.map(() => 0));

  for (let i = 0; i < ids.length; i++) {
    values[i][i] = 1;
    for (let j = i + 1; j < ids.length; j++) {
      const v = Math.max(-1, Math.min(1, (r() * 2 - 0.6))); // bias positive
      values[i][j] = v;
      values[j][i] = v;
    }
  }

  return { ids, values };
}