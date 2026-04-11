import { Box, Card, CardContent, Divider, Stack, Typography } from "@mui/material";

function MiniBars({ values }) {
  const max = Math.max(...values, 1);
  return (
    <Box sx={{ display: "flex", gap: 0.5, alignItems: "flex-end", height: 160 }}>
      {values.map((v, i) => (
        <Box
          key={i}
          sx={{
            width: 6,
            height: `${(v / max) * 100}%`,
            bgcolor: "rgba(46,125,50,0.6)",
            borderRadius: 1,
          }}
        />
      ))}
    </Box>
  );
}

function Donut({ normal, slow, jam }) {
  // SVG donut (placeholder “thật”, không cần lib)
  const r = 44;
  const c = 2 * Math.PI * r;
  const a = normal * c;
  const b = slow * c;
  const d = jam * c;

  return (
    <Box sx={{ display: "grid", placeItems: "center", height: 180 }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <g transform="translate(70,70) rotate(-90)">
          <circle r={r} cx="0" cy="0" fill="transparent" stroke="rgba(0,0,0,0.08)" strokeWidth="14" />
          <circle r={r} cx="0" cy="0" fill="transparent" stroke="rgba(46,125,50,0.75)" strokeWidth="14"
            strokeDasharray={`${a} ${c - a}`} strokeDashoffset="0" />
          <circle r={r} cx="0" cy="0" fill="transparent" stroke="rgba(249,168,37,0.85)" strokeWidth="14"
            strokeDasharray={`${b} ${c - b}`} strokeDashoffset={-a} />
          <circle r={r} cx="0" cy="0" fill="transparent" stroke="rgba(211,47,47,0.85)" strokeWidth="14"
            strokeDasharray={`${d} ${c - d}`} strokeDashoffset={-(a + b)} />
        </g>
      </svg>
      <Typography variant="caption" color="text.secondary" sx={{ mt: -2 }}>
        Replace with real chart lib if needed
      </Typography>
    </Box>
  );
}

export function TwoBarCharts({ speed, flow }) {
  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
      <Card variant="outlined" sx={{ flex: 1 }}>
        <CardContent>
          <Typography sx={{ fontWeight: 900 }}>Average speed by hour</Typography>
          <Typography variant="caption" color="text.secondary">km/h (mock)</Typography>
          <Divider sx={{ my: 1.5 }} />
          <MiniBars values={speed} />
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ flex: 1 }}>
        <CardContent>
          <Typography sx={{ fontWeight: 900 }}>Traffic flow by hour</Typography>
          <Typography variant="caption" color="text.secondary">vehicles (mock)</Typography>
          <Divider sx={{ my: 1.5 }} />
          <MiniBars values={flow} />
        </CardContent>
      </Card>
    </Stack>
  );
}

export function DonutCard({ distribution, summary }) {
  return (
    <Card variant="outlined" sx={{ maxWidth: 360 }}>
      <CardContent>
        <Typography sx={{ fontWeight: 900 }}>Traffic condition distribution</Typography>
        <Typography variant="caption" color="text.secondary">normal / slow / jam</Typography>
        <Divider sx={{ my: 1.5 }} />

        <Donut {...distribution} />

        <Divider sx={{ my: 1.5 }} />
        <Typography variant="body2" color="text.secondary">
          Avg speed: <b>{summary.avgSpeed.toFixed(1)}</b> km/h
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Max flow: <b>{Math.round(summary.maxFlow).toLocaleString()}</b>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Jam hours (est.): <b>{summary.jamHours}</b> / 24
        </Typography>
      </CardContent>
    </Card>
  );
}