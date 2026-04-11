import { Box, Card, CardContent, Divider, Stack, Typography } from "@mui/material";

function scoreLabel(x) {
  if (x >= 0.75) return "High";
  if (x >= 0.5) return "Medium";
  return "Low";
}

export function CongestionMapPlaceholder({ items }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography sx={{ fontWeight: 900 }}>
          This map shows the sections of road that are frequently congested
        </Typography>

        <Divider sx={{ my: 2 }} />

        {/* Map placeholder */}
        <Box
          sx={{
            height: 360,
            borderRadius: 2,
            border: "1px dashed rgba(0,0,0,0.25)",
            bgcolor: "rgba(0,0,0,0.04)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
            Map visualization
          </Typography>
        </Box>

        {/* Legend / list */}
        <Stack spacing={1.2} sx={{ mt: 2 }}>
          {items.slice(0, 8).map((it) => (
            <Box
              key={it.segmentId}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1,
                borderRadius: 2,
                bgcolor: "rgba(0,0,0,0.03)",
              }}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: 99,
                  bgcolor:
                    it.congestionScore >= 0.75 ? "#d32f2f" :
                    it.congestionScore >= 0.5 ? "#f9a825" :
                    "#2e7d32",
                }}
              />
              <Typography variant="body2" sx={{ flex: 1 }}>
                {it.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                {scoreLabel(it.congestionScore)} ({Math.round(it.congestionScore * 100)}%)
              </Typography>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}