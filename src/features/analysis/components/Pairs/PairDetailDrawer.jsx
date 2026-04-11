import {
  Box,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Loading } from "../../../../shared/components/Loading";
import { ErrorState } from "../../../../shared/components/ErrorState";
import { PairCharts } from "./PairCharts";

export function PairDetailDrawer({
  open,
  title,
  onClose,
  leftQuery,
  rightQuery,
  corrHint,
}) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 420 } }}>
      <Box sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
              {title || "Details"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Time-series details for selected node/pair
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {leftQuery.isLoading || rightQuery.isLoading ? <Loading label="Loading time series..." /> : null}
        {leftQuery.error ? <ErrorState error={leftQuery.error} /> : null}
        {rightQuery.error ? <ErrorState error={rightQuery.error} /> : null}

        {leftQuery.data && rightQuery.data ? (
          <PairCharts left={leftQuery.data} right={rightQuery.data} corrHint={corrHint} />
        ) : null}
      </Box>
    </Drawer>
  );
}
