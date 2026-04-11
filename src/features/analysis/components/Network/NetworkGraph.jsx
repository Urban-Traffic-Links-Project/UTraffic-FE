import { Card, CardContent, Divider, List, ListItemButton, ListItemText, Typography } from "@mui/material";
import { formatNumber } from "../../../../shared/utils/format";

/**
 * Placeholder "graph": list edges for now.
 * Swap this component to Cytoscape/ForceGraph later without touching the page/state.
 */
export function NetworkGraph({ nodes, edges, onSelectNode, onSelectPair }) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          Network (placeholder)
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Click a node or edge to open details.
        </Typography>

        <Divider sx={{ my: 1 }} />

        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
          Nodes
        </Typography>
        <List dense sx={{ maxHeight: 160, overflow: "auto", mb: 1 }}>
          {nodes.map((n) => (
            <ListItemButton key={n.id} onClick={() => onSelectNode(n.id)}>
              <ListItemText primary={n.name} secondary={n.id} />
            </ListItemButton>
          ))}
        </List>

        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
          Top edges
        </Typography>

        <List dense sx={{ flex: 1, overflow: "auto" }}>
          {edges.map((e, idx) => (
            <ListItemButton
              key={`${e.source}-${e.target}-${idx}`}
              onClick={() => onSelectPair({ source: e.source, target: e.target })}
            >
              <ListItemText
                primary={`${e.source} ↔ ${e.target}`}
                secondary={`corr=${formatNumber(e.corr, 2)} • lag=${e.lag}m`}
              />
            </ListItemButton>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
