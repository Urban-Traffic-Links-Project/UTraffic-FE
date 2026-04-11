import { Box, CircularProgress, Typography } from "@mui/material";

export function Loading({ label = "Loading..." }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 2 }}>
      <CircularProgress size={18} />
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}
