import { Box, Typography } from "@mui/material";

export function MapPlaceholder({ label, subtitle, height = 360 }) {
  return (
    <Box
      sx={{
        height,
        borderRadius: 2,
        border: "1px dashed rgba(0,0,0,0.2)",
        bgcolor: "rgba(0,0,0,0.05)",
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        p: 2,
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>
        {label}
      </Typography>
      {subtitle ? (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
}