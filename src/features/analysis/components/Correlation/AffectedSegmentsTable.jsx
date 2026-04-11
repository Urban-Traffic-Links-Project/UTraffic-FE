import {
    Card,
    CardContent,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";

export function AffectedSegmentsTable({ items }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography sx={{ fontWeight: 900 }}>
          List of road segments that have a high correlation with the road segment being analyzed:
        </Typography>

        <Divider sx={{ my: 1.5 }} />

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Road segment</TableCell>
              <TableCell sx={{ fontWeight: 800 }} align="right">Impact</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((x) => (
              <TableRow key={x.segmentId} hover>
                <TableCell>{x.name}</TableCell>
                <TableCell align="right">{Math.round(x.impact * 100)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}