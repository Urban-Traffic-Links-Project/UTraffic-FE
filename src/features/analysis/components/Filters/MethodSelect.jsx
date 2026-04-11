import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { METHODS } from "../../constants/methods";

export function MethodSelect({ value, onChange }) {
  return (
    <FormControl size="small" fullWidth>
      <InputLabel>Method</InputLabel>
      <Select label="Method" value={value} onChange={(e) => onChange(e.target.value)}>
        {METHODS.map((m) => (
          <MenuItem key={m.value} value={m.value}>
            {m.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
