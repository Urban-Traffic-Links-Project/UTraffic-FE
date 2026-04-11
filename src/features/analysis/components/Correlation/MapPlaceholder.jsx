import { Box, Typography } from "@mui/material";
import styles from "../../pages/CorrelationAnalysisPage.module.css";

export function MapPlaceholder({ selected }) {
  return (
    <Box className={styles.mapPh}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textAlign: "center" }}>
        {selected ? `Selected: ${selected.name}` : "No segment selected"}
      </Typography>
    </Box>
  );
}