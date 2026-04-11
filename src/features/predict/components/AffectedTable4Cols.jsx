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
  const out = [];
  for (let i = 0; i < arr.length; i += 2) out.push([arr[i], arr[i + 1]]);
  return out;
}

function levelColor(level) {
  if (level === "High") return "#d32f2f";
  if (level === "Medium") return "#f9a825";
  return "#2e7d32";
}

export function AffectedTable4Cols({ items }) {
  const rows = chunkPairs(items);

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography sx={{ fontWeight: 900, mb: 1 }}>
          List of road sections connected to the selected road section and the potential for being affected:
        </Typography>

        <Divider sx={{ mb: 1.5 }} />

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Road segments</TableCell>
              <TableCell
                sx={{ fontWeight: 800, borderRight: "2px solid rgba(0,0,0,0.12)" }}
              >
                potential to be affected
              </TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Road segments</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>
                potential to be affected
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map(([a, b], idx) => (
              <TableRow key={idx} hover>
                <TableCell>{a?.name || ""}</TableCell>
                <TableCell
                  sx={{ borderRight: "2px solid rgba(0,0,0,0.12)", fontWeight: 800, color: levelColor(a?.level) }}
                >
                  {a?.level || ""}
                </TableCell>

                <TableCell>{b?.name || ""}</TableCell>
                <TableCell sx={{ fontWeight: 800, color: levelColor(b?.level) }}>
                  {b?.level || ""}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}