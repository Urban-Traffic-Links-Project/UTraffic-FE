import { NavLink } from "react-router-dom";
import { Box, Divider, List, ListItemButton, ListItemText, Typography } from "@mui/material";
import { PATHS } from "../router/paths";

function Item({ to, label }) {
  return (
    <ListItemButton
      component={NavLink}
      to={to}
      sx={{
        borderRadius: 1,
        "&.active": {
          bgcolor: "action.selected",
        },
      }}
    >
      <ListItemText primary={label} />
    </ListItemButton>
  );
}

export function Sidebar({ width = 260 }) {
  return (
    <Box
      sx={{
        width,
        p: 2,
        borderRight: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Navigation
      </Typography>
      <Divider sx={{ mb: 1 }} />

      <List sx={{ display: "grid", gap: 1 }}>
        <Item to={PATHS.analysis} label="Analysis" />
      </List>
    </Box>
  );
}
