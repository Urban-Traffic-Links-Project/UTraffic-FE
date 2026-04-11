import { Box, Slider, Typography } from "@mui/material";

export function ThresholdSlider({ value, onChange }) {
  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="body2" color="text.secondary">
          Threshold
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {Number(value).toFixed(2)}
        </Typography>
      </Box>
      <Slider
        value={Number(value)}
        onChange={(_, v) => onChange(v)}
        min={0}
        max={1}
        step={0.01}
      />
    </Box>
  );
}
