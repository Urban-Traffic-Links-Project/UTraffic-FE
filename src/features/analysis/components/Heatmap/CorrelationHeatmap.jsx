import { Card, CardContent, Divider, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { formatNumber } from "../../../../shared/utils/format";

/**
 * Placeholder heatmap: renders a small matrix table.
 * Replace with ECharts heatmap later.
 */
export function CorrelationHeatmap({ matrix, onSelectPair }) {
  const ids = matrix?.ids ?? [];
  const show = ids.slice(0, 8); // keep small for UI

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          Correlation Matrix (placeholder)
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Showing first 8 nodes only.
        </Typography>
        <Divider sx={{ my: 1 }} />

        {!matrix ? (
          <Typography variant="body2" color="text.secondary">
            No matrix.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell />
                {show.map((id) => (
                  <TableCell key={id} align="right">{id}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {show.map((rowId) => (
                <TableRow key={rowId}>
                  <TableCell sx={{ fontWeight: 700 }}>{rowId}</TableCell>
                  {show.map((colId) => {
                    const i = ids.indexOf(rowId);
                    const j = ids.indexOf(colId);
                    const v = matrix.values[i][j];
                    const clickable = rowId !== colId;
                    return (
                      <TableCell
                        key={colId}
                        align="right"
                        sx={{
                          cursor: clickable ? "pointer" : "default",
                          userSelect: "none",
                        }}
                        onClick={() => clickable && onSelectPair({ source: rowId, target: colId })}
                        title={clickable ? "Click to open pair detail" : ""}
                      >
                        {formatNumber(v, 2)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
