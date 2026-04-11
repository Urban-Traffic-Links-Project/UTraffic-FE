import { Box, Card, CardContent, Divider, Typography } from "@mui/material";
import { formatNumber } from "../../../../shared/utils/format";

export function NetworkLegend({ edgesCount, threshold }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          Legend
        </Typography>
        <Divider sx={{ my: 1 }} />

        <Typography variant="body2" color="text.secondary">
          Edge shown if |corr| ≥ {formatNumber(threshold, 2)}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Edges: {edgesCount ?? "—"}
        </Typography>

        <Box sx={{ mt: 1.5 }}>
          <Typography variant="caption" color="text.secondary">
            (Graph rendering is a placeholder. Plug in Cytoscape / ForceGraph later.)
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
