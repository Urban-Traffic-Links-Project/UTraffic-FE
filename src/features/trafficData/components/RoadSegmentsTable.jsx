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

function chunkPairs(arr) {
  const result = [];
  for (let i = 0; i < arr.length; i += 2) {
    result.push([arr[i], arr[i + 1]]);
  }
  return result;
}

export function RoadSegmentsTable({ rows }) {
  const pairedRows = chunkPairs(rows);

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography sx={{ fontWeight: 900, mb: 1 }}>
          Road segments
        </Typography>

        <Divider sx={{ mb: 1 }} />

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>
                Road name
              </TableCell>

              {/* Cột có đường phân cách */}
              <TableCell
                sx={{
                  fontWeight: 800,
                  borderRight: "2px solid rgba(0,0,0,0.12)",
                }}
                align="right"
              >
                Records
              </TableCell>

              <TableCell sx={{ fontWeight: 800 }}>
                Road name
              </TableCell>

              <TableCell sx={{ fontWeight: 800 }} align="right">
                Records
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {pairedRows.map(([left, right], index) => (
              <TableRow key={index} hover>
                <TableCell>
                  {left?.name || ""}
                </TableCell>

                {/* Cột có đường phân cách */}
                <TableCell
                  align="right"
                  sx={{
                    borderRight: "2px solid rgba(0,0,0,0.12)",
                  }}
                >
                  {left ? left.records.toLocaleString() : ""}
                </TableCell>

                <TableCell>
                  {right?.name || ""}
                </TableCell>

                <TableCell align="right">
                  {right ? right.records.toLocaleString() : ""}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}