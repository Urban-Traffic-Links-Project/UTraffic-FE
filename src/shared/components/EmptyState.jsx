import { Box, Typography } from "@mui/material";

export function EmptyState({ title = "No data", subtitle }) {
  return (
    <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      {subtitle ? (
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
}
