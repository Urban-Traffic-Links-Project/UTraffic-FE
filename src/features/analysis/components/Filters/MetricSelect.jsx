import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { METRICS } from "../../constants/metrics";

export function MetricSelect({ value, onChange }) {
  return (
    <FormControl size="small" fullWidth>
      <InputLabel>Metric</InputLabel>
      <Select label="Metric" value={value} onChange={(e) => onChange(e.target.value)}>
        {METRICS.map((m) => (
          <MenuItem key={m.value} value={m.value}>
            {m.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
