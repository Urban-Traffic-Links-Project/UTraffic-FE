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
import { formatNumber } from "../../../../shared/utils/format";

export function PairsTable({ edges, onSelectPair }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          Top correlated pairs
        </Typography>
        <Divider sx={{ my: 1 }} />

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Pair</TableCell>
              <TableCell align="right">corr</TableCell>
              <TableCell align="right">lag (m)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {edges.map((e, idx) => (
              <TableRow
                key={`${e.source}-${e.target}-${idx}`}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() => onSelectPair({ source: e.source, target: e.target })}
              >
                <TableCell>{e.source} ↔ {e.target}</TableCell>
                <TableCell align="right">{formatNumber(e.corr, 2)}</TableCell>
                <TableCell align="right">{e.lag}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
