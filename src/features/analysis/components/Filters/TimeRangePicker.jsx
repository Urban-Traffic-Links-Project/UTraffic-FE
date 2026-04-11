import { Stack, TextField } from "@mui/material";

/**
 * Simple date inputs to avoid extra deps.
 * Swap to MUI X DateRangePicker later if you want.
 */
export function TimeRangePicker({ from, to, onChange }) {
  return (
    <Stack direction="row" spacing={1}>
      <TextField
        size="small"
        label="From"
        type="date"
        value={from}
        onChange={(e) => onChange({ from: e.target.value })}
        InputLabelProps={{ shrink: true }}
        fullWidth
      />
      <TextField
        size="small"
        label="To"
        type="date"
        value={to}
        onChange={(e) => onChange({ to: e.target.value })}
        InputLabelProps={{ shrink: true }}
        fullWidth
      />
    </Stack>
  );
}
