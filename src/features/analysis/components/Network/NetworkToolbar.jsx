import { Button, ButtonGroup, Card, CardContent, Stack, Typography } from "@mui/material";

export function NetworkToolbar({ viewMode, onViewModeChange, onClearSelection }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            View
          </Typography>

          <ButtonGroup size="small" variant="outlined">
            <Button
              variant={viewMode === "graph" ? "contained" : "outlined"}
              onClick={() => onViewModeChange("graph")}
            >
              Graph
            </Button>
            <Button
              variant={viewMode === "map" ? "contained" : "outlined"}
              onClick={() => onViewModeChange("map")}
            >
              Map
            </Button>
          </ButtonGroup>

          <Stack sx={{ flex: 1 }} />

          <Button size="small" onClick={onClearSelection}>
            Clear selection
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
