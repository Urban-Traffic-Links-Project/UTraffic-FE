/**
 * Mock API (Promise-based) that mimics backend calls.
 * You can safely build the entire UI using these functions.
 */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Simple seeded RNG for stable mock results per session */
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(123456);

/** @returns {import("../models/analysis.types").Node[]} */
function genNodes(n = 18) {
  const zones = ["Q1", "Q3", "Q5", "Q7"];
  const baseLat = 10.77;
  const baseLng = 106.69;

  return Array.from({ length: n }).map((_, i) => ({
    id: `N${String(i + 1).padStart(2, "0")}`,
    name: `Intersection ${i + 1}`,
    lat: baseLat + (rng() - 0.5) * 0.12,
    lng: baseLng + (rng() - 0.5) * 0.12,
    zone: zones[Math.floor(rng() * zones.length)],
  }));
}

const NODES = genNodes();

/** @returns {import("../models/analysis.types").Edge[]} */
function genEdges(nodes, threshold = 0.6, topN = 40) {
  const edges = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      // bias to produce more positive correlations
      const corr = (rng() * 2 - 0.4); // roughly [-0.4..1.6] then clamp
      const c = Math.max(-1, Math.min(1, corr));
      const abs = Math.abs(c);
      if (abs >= threshold) {
        edges.push({
          source: nodes[i].id,
          target: nodes[j].id,
          corr: c,
          lag: Math.floor(rng() * 16), // 0..15 minutes
        });
      }
    }
  }

  // sort by abs corr, keep topN
  edges.sort((a, b) => Math.abs(b.corr) - Math.abs(a.corr));
  return edges.slice(0, topN);
}

/** @returns {import("../models/analysis.types").Matrix} */
function genMatrix(nodes) {
  const ids = nodes.map((n) => n.id);
  const values = ids.map(() => ids.map(() => 0));

  for (let i = 0; i < ids.length; i++) {
    values[i][i] = 1;
    for (let j = i + 1; j < ids.length; j++) {
      const corr = (rng() * 2 - 0.5);
      const c = Math.max(-1, Math.min(1, corr));
      values[i][j] = c;
      values[j][i] = c;
    }
  }
  return { ids, values };
}

/** @returns {import("../models/analysis.types").TimeSeries} */
function genSeries(nodeId, metric, points = 48) {
  const now = Math.floor(Date.now() / 1000);
  const step = 30 * 60; // 30 minutes
  const base =
    metric === "speed" ? 30 + rng() * 20 :
    metric === "density" ? 0.4 + rng() * 0.4 :
    80 + rng() * 60;

  const amp =
    metric === "speed" ? 10 :
    metric === "density" ? 0.25 :
    50;

  const arr = Array.from({ length: points }).map((_, i) => {
    const t = now - (points - 1 - i) * step;
    const wave = Math.sin(i / 6) + 0.3 * Math.sin(i / 2.7);
    const noise = (rng() - 0.5) * (metric === "density" ? 0.06 : 6);
    const v = base + amp * wave + noise;
    return { t, v: Math.max(0, Number(v.toFixed(2))) };
  });

  return { nodeId, metric, points: arr };
}

// Public API
export async function fetchNodes() {
  await sleep(250);
  return NODES;
}

export async function fetchEdges(filters) {
  await sleep(300);
  const threshold = Number(filters?.threshold ?? 0.6);
  const topN = Number(filters?.topN ?? 40);
  return genEdges(NODES, threshold, topN);
}

export async function fetchCorrelationMatrix(filters) {
  await sleep(280);
  return genMatrix(NODES);
}

export async function fetchTimeSeries(nodeId, filters) {
  await sleep(220);
  const metric = filters?.metric || "flow";
  return genSeries(nodeId, metric);
}
