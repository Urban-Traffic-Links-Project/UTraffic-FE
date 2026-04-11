import { Box, Divider, Typography } from "@mui/material";
import { formatNumber } from "../../../../shared/utils/format";

/**
 * Placeholder for charts. Later you can drop ECharts/Recharts here.
 */
export function PairCharts({ left, right, corrHint }) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
        Charts (placeholder)
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Left series points: {left?.points?.length ?? "—"} • Right series points: {right?.points?.length ?? "—"}
      </Typography>
      {corrHint != null ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          corr hint: {formatNumber(corrHint, 2)}
        </Typography>
      ) : null}
      <Divider sx={{ my: 1.5 }} />
      <Typography variant="caption" color="text.secondary">
        Plug in ECharts line + scatter here.
      </Typography>
    </Box>
  );
}
