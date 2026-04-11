export function toLineSeries(timeSeries) {
  // Generic adapter for chart libraries later.
  return timeSeries.points.map((p) => ({ x: p.t * 1000, y: p.v }));
}
