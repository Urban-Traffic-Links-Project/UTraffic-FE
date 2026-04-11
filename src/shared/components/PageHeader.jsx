import { Box, Typography } from "@mui/material";

export function PageHeader({ title, subtitle, right }) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-end", gap: 2, mb: 2 }}>
      <Box sx={{ flex: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {right ? <Box>{right}</Box> : null}
    </Box>
  );
}
