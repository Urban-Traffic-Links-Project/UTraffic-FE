import {
    Box,
    Card,
    CardContent,
    Chip,
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

function LevelChip({ level, score }) {
  const color = level === "Cao" ? "error" : level === "Trung bình" ? "warning" : "success";
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Chip label={level} color={color} size="small" sx={{ fontWeight: 700, minWidth: 72 }} />
      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
        {(score * 100).toFixed(2)}%
      </Typography>
    </Box>
  );
}

export function AffectedTable4Cols({ items }) {
  const rows = chunkPairs(items);

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography sx={{ fontWeight: 900, mb: 0.5 }}>
          Danh sách đoạn đường có khả năng bị ảnh hưởng ùn tắc
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
          Dựa trên mô hình Sparse TVP-VAR-Gt — điểm ảnh hưởng cao hơn = nguy cơ lây lan lớn hơn
        </Typography>

        <Divider sx={{ mb: 1.5 }} />

        <Table size="small">
          <TableHead>
            <TableRow sx={{ "& th": { backgroundColor: "rgba(0,0,0,0.03)" } }}>
              <TableCell sx={{ fontWeight: 800 }}>Đoạn đường</TableCell>
              <TableCell sx={{ fontWeight: 800, borderRight: "2px solid rgba(0,0,0,0.12)", minWidth: 150 }}>
                Mức độ ảnh hưởng
              </TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Đoạn đường</TableCell>
              <TableCell sx={{ fontWeight: 800, minWidth: 150 }}>
                Mức độ ảnh hưởng
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map(([a, b], idx) => (
              <TableRow key={idx} hover>
                <TableCell sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {a?.name || ""}
                </TableCell>
                <TableCell sx={{ borderRight: "2px solid rgba(0,0,0,0.12)" }}>
                  {a ? <LevelChip level={a.level} score={a.score} /> : null}
                </TableCell>

                <TableCell sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {b?.name || ""}
                </TableCell>
                <TableCell>
                  {b ? <LevelChip level={b.level} score={b.score} /> : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}