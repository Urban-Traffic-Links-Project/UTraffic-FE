import { Card, CardContent, Grid, TextField } from "@mui/material";
import { MetricSelect } from "./MetricSelect";
import { MethodSelect } from "./MethodSelect";
import { TimeRangePicker } from "./TimeRangePicker";
import { ThresholdSlider } from "./ThresholdSlider";

export function FiltersBar({ filters, onChange }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <MetricSelect value={filters.metric} onChange={(metric) => onChange({ metric })} />
          </Grid>
          <Grid item xs={12} md={3}>
            <MethodSelect value={filters.method} onChange={(method) => onChange({ method })} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TimeRangePicker
              from={filters.from}
              to={filters.to}
              onChange={(patch) => onChange(patch)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              size="small"
              label="Top N pairs"
              type="number"
              fullWidth
              value={filters.topN}
              onChange={(e) => onChange({ topN: Math.max(1, Number(e.target.value || 1)) })}
            />
          </Grid>

          <Grid item xs={12}>
            <ThresholdSlider value={filters.threshold} onChange={(threshold) => onChange({ threshold })} />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
