import { Box, Card, CardContent, Divider, Typography } from "@mui/material";

/** Simple heat color for correlation value [-1..1] */
function cellColor(v) {
  // map [-1..1] -> hue-ish: blue (neg) to red (pos)
  // keep simple with rgba
  if (v >= 0) return `rgba(211,47,47,${0.12 + 0.55 * Math.min(1, v)})`;
  return `rgba(25,118,210,${0.12 + 0.55 * Math.min(1, Math.abs(v))})`;
}

export function CorrelationMatrixPlaceholder({ matrix }) {
  const ids = matrix?.ids ?? [];

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography sx={{ fontWeight: 900 }}>Correlation matrix</Typography>

        <Divider sx={{ my: 1.5 }} />

        <Box sx={{ overflow: "auto" }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: `140px repeat(${ids.length}, 44px)`,
              gap: "2px",
              minWidth: 140 + ids.length * 44,
              alignItems: "stretch",
            }}
          >
            {/* header row */}
            <Box />
            {ids.map((id) => (
              <Box
                key={`h-${id}`}
                sx={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "text.secondary",
                  textAlign: "center",
                  p: 1,
                  whiteSpace: "nowrap",
                }}
                title={id}
              >
                {id}
              </Box>
            ))}

            {/* body */}
            {ids.map((rowId, i) => (
              <Box key={`r-${rowId}`} sx={{ display: "contents" }}>
                <Box
                  sx={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "text.secondary",
                    p: 1,
                    whiteSpace: "nowrap",
                  }}
                  title={rowId}
                >
                  {rowId}
                </Box>

                {ids.map((colId, j) => {
                  const v = matrix.values[i][j];
                  return (
                    <Box
                      key={`${rowId}-${colId}`}
                      sx={{
                        height: 34,
                        borderRadius: 1,
                        bgcolor: cellColor(v),
                        border: "1px solid rgba(0,0,0,0.06)",
                        display: "grid",
                        placeItems: "center",
                        fontSize: 10,
                        fontWeight: 800,
                        color: "rgba(0,0,0,0.55)",
                        userSelect: "none",
                      }}
                      title={`${rowId} vs ${colId}: ${v.toFixed(2)}`}
                    >
                      {v.toFixed(2)}
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}