/**
 * CorrelationAnalysisPage.jsx — Trang phân tích tương quan
 *
 * Layout:
 *  1. Toolbar compact (title + mode toggle)
 *  2. Controls (SnapshotSelector / Forecast picker) — có margin, không đè bản đồ
 *  3. Map — full width, bộ lọc nhỏ nổi ở góc bản đồ + legend overlay
 *  4. Danh sách kết quả — phía dưới bản đồ
 */
import {
  Box, Chip, CircularProgress, Divider, ToggleButton, ToggleButtonGroup,
  Paper, Slider, Stack, Typography, IconButton, Tooltip, Button, LinearProgress,
  Grid, Container, Card,
} from "@mui/material";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import HistoryIcon from "@mui/icons-material/History";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import { correlationApi } from "../api/correlationApi.index";
import { NodeCorrelationMap } from "../components/Correlation/NodeCorrelationMap";
import {
  HorizonSlider,
  ForecastTimePicker,
  ForecastEgoSidebar,
  horizonLabel,
} from "../components/Forecast/ForecastPanel";
import * as forecastApi from "../api/forecastApi";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function corrColor(corr) {
  const abs = Math.abs(corr ?? 0);
  if (abs >= 0.8) return "#ef5350";
  if (abs >= 0.6) return "#ff9800";
  if (abs >= 0.4) return "#fdd835";
  return "#66bb6a";
}

function corrLabel(corr) {
  const abs = Math.abs(corr ?? 0);
  if (abs >= 0.8) return "Rất cao";
  if (abs >= 0.6) return "Cao";
  if (abs >= 0.4) return "Trung bình";
  return "Thấp";
}

function getNodeDisplayName(node) {
  const streetName = node?.street_name?.trim();
  if (streetName) return streetName;
  if (Number.isFinite(node?.node_index)) return `Nút giao #${node.node_index + 1}`;
  if (node?.osm_node_id) return `Nút giao OSM ${node.osm_node_id}`;
  return "Nút giao";
}

function slotToTime(slot) {
  if (!slot) return "";
  const code = slot.replace("Slot_", "");
  return `${code.slice(0, 2)}:${code.slice(2)}`;
}

function dateToShort(dateStr) {
  if (!dateStr) return "";
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

const EGO_FILTER_PRESETS = [
  { label: "Gần", maxDist: 500, minCorr: 0.3 },
  { label: "Cân bằng", maxDist: 1000, minCorr: 0.5 },
  { label: "Rộng", maxDist: 1500, minCorr: 0.3 },
  { label: "Mạnh", maxDist: 1200, minCorr: 0.7 },
];

// ─── SnapshotSelector ─────────────────────────────────────────────────────────
function SnapshotSelector({ dates, slots, selectedDate, selectedSlot, onChange, disabled }) {
  const dateIdx = dates.indexOf(selectedDate);
  const slotIdx = slots.indexOf(selectedSlot);
  const [draftDateIdx, setDraftDateIdx] = useState(Math.max(0, dateIdx));
  const [draftSlotIdx, setDraftSlotIdx] = useState(Math.max(0, slotIdx));

  useEffect(() => {
    const idx = dates.indexOf(selectedDate);
    if (idx >= 0) setDraftDateIdx(idx);
  }, [selectedDate, dates]);

  useEffect(() => {
    const idx = slots.indexOf(selectedSlot);
    if (idx >= 0) setDraftSlotIdx(idx);
  }, [selectedSlot, slots]);

  const draftDate = dates[draftDateIdx] ?? selectedDate;
  const draftSlot = slots[draftSlotIdx] ?? selectedSlot;

  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 3,
        bgcolor: "#f8fafc",
        border: "1px solid #e2e8f0"
      }}
    >
      {/* Row 1: Header Inline */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, flexWrap: "nowrap", width: "100%", overflow: "hidden" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
          <AccessTimeIcon sx={{ fontSize: 18, color: "primary.main" }} />
          <Typography variant="subtitle2" fontWeight={800} color="primary.main" sx={{ fontSize: "0.875rem", whiteSpace: "nowrap" }}>
            Thời điểm phân tích
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          (Chọn ngày và khung giờ phân tích)
        </Typography>
        <Box sx={{ flex: 1 }} />
        {selectedDate && selectedSlot && (
          <Chip
            size="small"
            label={`${dateToShort(selectedDate)} · ${slotToTime(selectedSlot)}`}
            color="primary"
            sx={{ fontWeight: 700, fontSize: "0.72rem", flexShrink: 0 }}
          />
        )}
      </Box>

      {/* Row 2: Sliders side-by-side */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={4} sx={{ width: "100%" }}>
        {/* Date slider Column */}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 0.5, width: "100%" }}>
            <CalendarTodayIcon sx={{ fontSize: 12, color: "text.secondary", mr: 0.5 }} />
            <Typography variant="caption" color="text.secondary" fontWeight={700}>NGÀY</Typography>
            <Typography variant="caption" color="primary.main" fontWeight={700} sx={{ ml: "auto" }}>{draftDate}</Typography>
          </Box>
          <Slider
            disabled={disabled || dates.length === 0}
            min={0} max={Math.max(0, dates.length - 1)} step={1}
            value={draftDateIdx}
            onChange={(_, v) => setDraftDateIdx(v)}
            onChangeCommitted={(_, v) => onChange(dates[v], slots[draftSlotIdx] ?? selectedSlot)}
            marks={dates.map((d, i) => ({ value: i, label: dateToShort(d) }))}
            valueLabelDisplay="off"
            sx={{
              width: "100%",
              "& .MuiSlider-markLabel": { fontSize: "0.62rem", color: "text.secondary" },
              "& .MuiSlider-mark": { height: 5 }
            }}
          />
        </Box>

        {/* Slot slider Column */}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 0.5, width: "100%" }}>
            <AccessTimeIcon sx={{ fontSize: 12, color: "text.secondary", mr: 0.5 }} />
            <Typography variant="caption" color="text.secondary" fontWeight={700}>KHUNG GIỜ (15 phút)</Typography>
            <Typography variant="caption" color="primary.main" fontWeight={700} sx={{ ml: "auto" }}>{slotToTime(draftSlot)}</Typography>
          </Box>
          <Slider
            disabled={disabled || slots.length === 0}
            min={0} max={Math.max(0, slots.length - 1)} step={1}
            value={draftSlotIdx}
            onChange={(_, v) => setDraftSlotIdx(v)}
            onChangeCommitted={(_, v) => onChange(dates[draftDateIdx] ?? selectedDate, slots[v])}
            marks={slots.map((s, i) => ({ value: i, label: i % 3 === 0 ? slotToTime(s) : "" }))}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => slotToTime(slots[v] ?? "")}
            sx={{
              width: "100%",
              "& .MuiSlider-markLabel": { fontSize: "0.62rem", color: "text.secondary" },
              "& .MuiSlider-mark": { height: 5 }
            }}
          />
        </Box>
      </Stack>
    </Paper>
  );
}

// ─── FilterOverlay — panel nhỏ nổi trên bản đồ ───────────────────────────────
function FilterOverlay({ filters, onFilterChange }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(filters);

  useEffect(() => { setDraft(filters); }, [filters]);

  function commit(next) {
    setDraft(next);
    if (next.maxDist !== filters.maxDist || next.minCorr !== filters.minCorr) {
      onFilterChange(next);
    }
  }

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(220,230,240,0.9)",
        borderRadius: 2.5,
        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
        overflow: "hidden",
        minWidth: 200,
      }}
    >
      {/* Header — luôn hiển thị, click để mở/đóng */}
      <Box
        onClick={() => setOpen((v) => !v)}
        sx={{
          display: "flex", alignItems: "center", gap: 0.75,
          px: 1.5, py: 1,
          cursor: "pointer",
          bgcolor: open ? "rgba(25,118,210,0.06)" : "transparent",
          transition: "background 0.15s",
          "&:hover": { bgcolor: "rgba(25,118,210,0.08)" },
        }}
      >
        <FilterAltIcon sx={{ fontSize: 14, color: "primary.main" }} />
        <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ flex: 1, fontSize: "0.75rem" }}>
          BỘ LỌC
        </Typography>
        <Chip
          size="small"
          label={`${filters.maxDist}m / ≥${filters.minCorr}`}
          sx={{ fontSize: "0.65rem", height: 18, fontWeight: 700 }}
        />
        {open
          ? <ExpandLessIcon sx={{ fontSize: 14, color: "text.secondary" }} />
          : <ExpandMoreIcon sx={{ fontSize: 14, color: "text.secondary" }} />
        }
      </Box>

      {/* Body — chỉ hiển thị khi mở */}
      {open && (
        <Box sx={{ px: 1.5, pb: 1.5, pt: 0.5 }}>
          <Divider sx={{ mb: 1 }} />

          <Typography variant="caption" color="text.secondary" display="block">
            Phạm vi: <b>{draft.maxDist} m</b>
          </Typography>
          <Slider
            size="small" min={200} max={3000} step={100}
            value={draft.maxDist}
            onChange={(_, v) => setDraft((p) => ({ ...p, maxDist: v }))}
            onChangeCommitted={(_, v) => commit({ ...draft, maxDist: v })}
            valueLabelDisplay="auto"
            sx={{ mt: 0.25, mb: 1.5 }}
          />

          <Typography variant="caption" color="text.secondary" display="block">
            |Corr| tối thiểu: <b>{draft.minCorr.toFixed(1)}</b>
          </Typography>
          <Slider
            size="small" min={0} max={1} step={0.1}
            value={draft.minCorr}
            onChange={(_, v) => setDraft((p) => ({ ...p, minCorr: v }))}
            onChangeCommitted={(_, v) => commit({ ...draft, minCorr: v })}
            valueLabelDisplay="auto"
            sx={{ mt: 0.25, mb: 1 }}
          />

          <Stack direction="row" spacing={0.5} flexWrap="wrap" rowGap={0.5}>
            {EGO_FILTER_PRESETS.map((preset) => {
              const active = draft.maxDist === preset.maxDist && draft.minCorr === preset.minCorr;
              return (
                <Chip
                  key={preset.label} size="small" label={preset.label}
                  color={active ? "primary" : "default"}
                  variant={active ? "filled" : "outlined"}
                  onClick={() => commit({ maxDist: preset.maxDist, minCorr: preset.minCorr })}
                  sx={{ fontSize: "0.65rem", height: 20 }}
                />
              );
            })}
            <Button
              size="small" variant="text"
              onClick={() => commit({ maxDist: 1000, minCorr: 0.5 })}
              sx={{ minWidth: "auto", px: 0.75, fontSize: "0.65rem", height: 20 }}
            >Reset</Button>
          </Stack>
        </Box>
      )}
    </Paper>
  );
}

// ─── MapLegend overlay ────────────────────────────────────────────────────────
function MapLegend({ focusMode }) {
  const items = focusMode ? [
    { color: "#ff6f00", label: "Node chọn" },
    { color: "#d32f2f", label: "≥ 0.8" },
    { color: "#f57c00", label: "≥ 0.6" },
    { color: "#fbc02d", label: "≥ 0.4" },
    { color: "#388e3c", label: "< 0.4" },
    { color: "#b0bec5", label: "Ngoài vùng" },
  ] : [
    { color: "#7dd3fc", label: "< 3" },
    { color: "#f59e0b", label: "3–4" },
    { color: "#2563eb", label: "4–5" },
    { color: "#ef4444", label: "≥ 5" },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "rgba(255,255,255,0.93)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(220,230,240,0.9)",
        borderRadius: 2,
        px: 1.5, py: 0.75,
        display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center",
        boxShadow: "0 2px 10px rgba(0,0,0,0.09)",
      }}
    >
      <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ fontSize: "0.65rem" }}>
        {focusMode ? "TƯƠNG QUAN" : "ĐỘ QUAN TRỌNG"}
      </Typography>
      {items.map(({ color, label }) => (
        <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color, flexShrink: 0 }} />
          <Typography variant="caption" sx={{ fontSize: "0.65rem" }}>{label}</Typography>
        </Box>
      ))}
      {!focusMode && (
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.63rem" }}>
          · Click node để xem
        </Typography>
      )}
    </Paper>
  );
}

// ─── EgoResultsPanel — hiển thị dưới bản đồ ──────────────────────────────────
function EgoResultsPanel({ selectedNode, egoData, egoLoading, onReset, nodeLookup }) {
  if (!selectedNode) {
    return (
      <Box
        sx={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 1.5, py: 2.5,
          bgcolor: "#f8fafc",
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <MyLocationIcon sx={{ fontSize: 24, color: "text.disabled" }} />
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            Chưa chọn nút giao nào
          </Typography>
          <Typography variant="caption" color="text.disabled">
            Click vào một node trên bản đồ để xem tương quan
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!egoData && egoLoading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 2, px: 2, borderTop: "1px solid #e2e8f0", bgcolor: "#f8fafc" }}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary" fontWeight={600}>
          Đang tính tương quan...
        </Typography>
      </Box>
    );
  }

  if (!egoData) return null;

  const { neighbors } = egoData;
  const top10 = [...neighbors].slice(0, 10);
  const avgAbsCorr = neighbors.length
    ? neighbors.reduce((s, n) => s + Math.abs(n.corr ?? 0), 0) / neighbors.length
    : 0;

  return (
    <Box sx={{ borderTop: "1px solid #e2e8f0", bgcolor: "#fff", position: "relative" }}>
      {egoLoading && (
        <LinearProgress sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 2 }} />
      )}

      {/* Header dải thông tin node */}
      <Box
        sx={{
          px: 2, py: 1.25,
          bgcolor: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap",
        }}
      >
        <MyLocationIcon sx={{ color: "#ff6f00", fontSize: 18 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ fontSize: "0.875rem" }}>
            {getNodeDisplayName(selectedNode)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            OSM {selectedNode.osm_node_id}
            {egoData.snapshot_mode && ` · ${dateToShort(egoData.snapshot_date)} ${slotToTime(egoData.snapshot_slot)}`}
          </Typography>
        </Box>

        {/* Stats chips */}
        <Stack direction="row" spacing={0.75} flexWrap="wrap">
          <Chip size="small" label={`${neighbors.length} lân cận`} color="primary" variant="outlined" sx={{ fontSize: "0.68rem" }} />
          <Chip size="small" label={`${neighbors.filter((n) => n.is_adjacent).length} kề`} variant="outlined" sx={{ fontSize: "0.68rem" }} />
          <Chip size="small" label={`|corr| TB ${avgAbsCorr.toFixed(2)}`} variant="outlined" sx={{ fontSize: "0.68rem" }} />
        </Stack>

        <Tooltip title="Thoát focus">
          <IconButton size="small" onClick={onReset} sx={{ ml: "auto" }}>
            <ZoomOutMapIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Danh sách Top 10 — ngang */}
      <Box sx={{ px: 2, py: 1.5, overflowX: "auto" }}>
        {egoData.is_error ? (
          <Box sx={{ py: 1.5, px: 2, borderRadius: 2, border: "1px dashed", borderColor: "error.main", bgcolor: "rgba(211,47,47,0.04)" }}>
            <Typography variant="body2" fontWeight={700} color="error.main">Không có dữ liệu (404)</Typography>
            <Typography variant="caption" color="error.main">
              Thời điểm này chưa có dữ liệu tương quan. Vui lòng chọn khung giờ khác.
            </Typography>
          </Box>
        ) : top10.length === 0 ? (
          <Box sx={{ py: 1.5, px: 2, borderRadius: 2, border: "1px dashed", borderColor: "divider" }}>
            <Typography variant="body2" fontWeight={700}>Không có node phù hợp bộ lọc</Typography>
            <Typography variant="caption" color="text.secondary">Hãy tăng phạm vi hoặc giảm ngưỡng |corr|.</Typography>
          </Box>
        ) : (
          <>
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1.25, display: "block", fontSize: "0.75rem", letterSpacing: "0.04em" }}>
              TOP {top10.length} TƯƠNG QUAN CAO NHẤT
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "nowrap", overflowX: "auto", pb: 0.5 }}>
              {top10.map((nb, i) => (
                <Paper
                  key={nb.id}
                  variant="outlined"
                  sx={{
                    flexShrink: 0,
                    width: 150,
                    p: 1.25,
                    borderRadius: 2,
                    borderLeft: `3px solid ${corrColor(nb.corr)}`,
                    bgcolor: "#fafafa",
                    opacity: egoLoading ? 0.6 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 900, fontSize: "0.85rem", color: corrColor(nb.corr), display: "block" }}
                  >
                    {i + 1}. {nb.corr >= 0 ? "+" : ""}{nb.corr.toFixed(3)}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: "0.65rem", color: corrColor(nb.corr) }}>
                    {corrLabel(nb.corr)}
                  </Typography>
                  <Typography
                    variant="caption"
                    display="block"
                    noWrap
                    sx={{ fontWeight: 600, mt: 0.5, fontSize: "0.72rem" }}
                  >
                    {getNodeDisplayName(nodeLookup.get(nb.osm_node_id) ?? nb)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
                    {nb.dist_m}m · {nb.is_adjacent ? "kề nhau" : "không kề"}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          </>
        )}
      </Box>
    </Box>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function CorrelationAnalysisPage() {
  const [pageMode, setPageMode] = useState("historical");

  // Historical state
  const [selectedNode, setSelectedNode] = useState(null);
  const [focusMode, setFocusMode]       = useState(false);
  const [egoData, setEgoData]           = useState(null);
  const [egoLoading, setEgoLoading]     = useState(false);
  const [filters, setFilters]           = useState({ maxDist: 500, minCorr: 0.3 });
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Forecast state
  const [fctNode, setFctNode]         = useState(null);
  const [fctFocusMode, setFctFocus]   = useState(false);
  const [fctData, setFctData]         = useState(null);
  const [fctLoading, setFctLoading]   = useState(false);
  const [fctFilters, setFctFilters]   = useState({ maxDist: 1000, minCorr: 0.3 });
  const [fctHorizon, setFctHorizon]   = useState(1);
  const [fctDate, setFctDate]         = useState(null);
  const [fctSlot, setFctSlot]         = useState(null);

  // Queries
  const nodesQuery = useQuery({
    queryKey: ["corr-nodes"],
    queryFn: () => correlationApi.fetchNodes(),
    staleTime: Infinity,
  });
  const edgesQuery = useQuery({
    queryKey: ["corr-edges"],
    queryFn: () => correlationApi.fetchEdges(),
    staleTime: Infinity,
  });
  const snapshotsQuery = useQuery({
    queryKey: ["corr-snapshots"],
    queryFn: () => correlationApi.fetchSnapshots(),
    staleTime: 5 * 60_000,
  });
  const fctSnapshotsQuery = useQuery({
    queryKey: ["forecast-snapshots"],
    queryFn: () => forecastApi.fetchForecastSnapshots(),
    staleTime: 5 * 60_000,
  });

  // Historical derived
  const dates = snapshotsQuery.data?.dates ?? [];
  const allSnapshots = snapshotsQuery.data?.snapshots ?? [];
  const slots = useMemo(() => {
    if (!selectedDate || allSnapshots.length === 0) return snapshotsQuery.data?.slots ?? [];
    const validSlots = allSnapshots.filter((s) => s.date === selectedDate).map((s) => s.slot);
    return Array.from(new Set(validSlots)).sort();
  }, [selectedDate, allSnapshots, snapshotsQuery.data?.slots]);

  // Forecast derived
  const fctDates = fctSnapshotsQuery.data?.dates ?? [];
  const fctAllSnapshots = fctSnapshotsQuery.data?.snapshots ?? [];
  const fctSlots = useMemo(() => {
    if (!fctDate || fctAllSnapshots.length === 0) return fctSnapshotsQuery.data?.slots ?? [];
    const validSlots = fctAllSnapshots.filter((s) => s.date === fctDate).map((s) => s.slot);
    return Array.from(new Set(validSlots)).sort();
  }, [fctDate, fctAllSnapshots, fctSnapshotsQuery.data?.slots]);

  // Auto-select historical default
  useEffect(() => {
    if (!snapshotsQuery.data?.snapshots?.length) return;
    const data = snapshotsQuery.data;
    const currentDayValid = selectedDate && slots.includes(selectedSlot);
    if (!selectedDate || !selectedSlot || !currentDayValid) {
      const nextDate = selectedDate || data.dates[0];
      const nextSlots = Array.from(new Set(allSnapshots.filter((s) => s.date === nextDate).map((s) => s.slot))).sort();
      if (nextSlots.length > 0) {
        setSelectedDate(nextDate);
        setSelectedSlot(nextSlots.includes("Slot_0815") ? "Slot_0815" : nextSlots[0]);
      }
    }
  }, [snapshotsQuery.data, selectedDate, selectedSlot, slots, allSnapshots]);

  // Auto-select forecast default
  useEffect(() => {
    if (!fctSnapshotsQuery.data?.snapshots?.length) return;
    const data = fctSnapshotsQuery.data;
    const currentDayValid = fctDate && fctSlots.includes(fctSlot);
    if (!fctDate || !fctSlot || !currentDayValid) {
      const nextDate = fctDate || data.dates[0];
      const nextSlots = Array.from(new Set(fctAllSnapshots.filter((s) => s.date === nextDate).map((s) => s.slot))).sort();
      if (nextSlots.length > 0) {
        setFctDate(nextDate);
        setFctSlot(nextSlots.includes("Slot_1100") ? "Slot_1100" : nextSlots[0]);
      }
    }
  }, [fctSnapshotsQuery.data, fctDate, fctSlot, fctSlots, fctAllSnapshots]);

  const currentSnapshotMode = selectedDate && selectedSlot ? `${selectedDate}_${selectedSlot}` : null;

  // Historical handlers
  const doFetchEgo = useCallback(async (node, snapshotMode, egoFilters) => {
    setEgoLoading(true);
    try {
      const data = await correlationApi.fetchCorrelation(node.osm_node_id, {
        max_dist_m: egoFilters.maxDist,
        min_corr: egoFilters.minCorr,
        snapshot_mode: snapshotMode ?? undefined,
      });
      setEgoData(data);
      setFocusMode(true);
    } catch (err) {
      console.error("fetchCorrelation error:", err);
      const modeStr = snapshotMode || "";
      const isUnderscore = modeStr.includes("_");
      setEgoData({
        snapshot_mode: modeStr,
        snapshot_date: isUnderscore ? modeStr.split("_")[0] : null,
        snapshot_slot: isUnderscore ? modeStr.split("_Slot_")[1] ? `Slot_${modeStr.split("_Slot_")[1]}` : null : null,
        selected: node, neighbors: [], total: 0, is_error: true,
      });
      setFocusMode(true);
    } finally {
      setEgoLoading(false);
    }
  }, []);

  const handleNodeClick = useCallback(async (node) => {
    if (pageMode === "forecast") {
      setFctNode(node);
      await doFetchForecast(node, fctDate, fctSlot, fctHorizon, fctFilters);
    } else {
      setSelectedNode(node);
      await doFetchEgo(node, currentSnapshotMode, filters);
    }
  }, [pageMode, doFetchEgo, currentSnapshotMode, filters, fctDate, fctSlot, fctHorizon, fctFilters]); // eslint-disable-line

  const handleMapClick = useCallback(() => {
    setFocusMode(false); setSelectedNode(null); setEgoData(null);
    setFctFocus(false); setFctNode(null); setFctData(null);
  }, []);

  const handleFilterChange = useCallback(async (newFilters) => {
    setFilters(newFilters);
    if (!selectedNode) return;
    await doFetchEgo(selectedNode, currentSnapshotMode, newFilters);
  }, [selectedNode, doFetchEgo, currentSnapshotMode]);

  const handleSnapshotChange = useCallback(async (newDate, newSlot) => {
    setSelectedDate(newDate);
    setSelectedSlot(newSlot);
    if (!selectedNode || !focusMode) return;
    await doFetchEgo(selectedNode, `${newDate}_${newSlot}`, filters);
  }, [selectedNode, focusMode, doFetchEgo, filters]);

  // Forecast handlers
  const doFetchForecast = useCallback(async (node, date, slot, horizon, ffilters) => {
    if (!node || !date || !slot) return;
    setFctLoading(true);
    try {
      const data = await forecastApi.fetchForecastNode(
        node.osm_node_id, date, slot, horizon,
        { max_dist_m: ffilters.maxDist || undefined, min_corr: ffilters.minCorr || undefined }
      );
      setFctData(data); setFctFocus(true);
    } catch (err) {
      console.error("fetchForecast error:", err);
      setFctData(null); setFctFocus(false);
    } finally {
      setFctLoading(false);
    }
  }, []);

  const handleFctHorizonChange = useCallback((h) => {
    setFctHorizon(h);
    if (!fctNode || !fctDate || !fctSlot) return;
    doFetchForecast(fctNode, fctDate, fctSlot, h, fctFilters);
  }, [fctNode, fctDate, fctSlot, fctFilters, doFetchForecast]);

  const handleFctTimeChange = useCallback((newDate, newSlot) => {
    const validSlots = Array.from(new Set(fctAllSnapshots.filter((s) => s.date === newDate).map((s) => s.slot))).sort();
    let targetSlot = newSlot;
    if (validSlots.length > 0 && !validSlots.includes(newSlot)) {
      targetSlot = validSlots.includes("Slot_1100") ? "Slot_1100" : validSlots[0];
    }
    setFctDate(newDate); setFctSlot(targetSlot);
    if (!fctNode || !fctFocusMode) return;
    doFetchForecast(fctNode, newDate, targetSlot, fctHorizon, fctFilters);
  }, [fctNode, fctFocusMode, fctHorizon, fctFilters, doFetchForecast, fctAllSnapshots]);

  const handleFctFilterChange = useCallback((newFilters) => {
    setFctFilters(newFilters);
    if (!fctNode || !fctDate || !fctSlot) return;
    doFetchForecast(fctNode, fctDate, fctSlot, fctHorizon, newFilters);
  }, [fctNode, fctDate, fctSlot, fctHorizon, doFetchForecast]);

  // Derived
  const isLoading     = nodesQuery.isLoading || edgesQuery.isLoading;
  const showSidebar   = focusMode && Boolean(egoData);
  const showFctSidebar = fctFocusMode && Boolean(fctData);
  const nodeLookup    = useMemo(
    () => new Map((nodesQuery.data ?? []).map((n) => [n.osm_node_id, n])),
    [nodesQuery.data]
  );
  const activeFocus   = pageMode === "historical" ? focusMode   : fctFocusMode;
  const activeEgoData = pageMode === "historical" ? egoData     : fctData;

  const viewportKey = useMemo(() => {
    if (!activeFocus) return "free";
    const node = pageMode === "historical" ? egoData?.selected : fctData?.selectedNode;
    if (!node) return "free";
    return `${node.osm_node_id}:${pageMode}:${fctHorizon}`;
  }, [activeFocus, egoData, fctData, pageMode, fctHorizon]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ bgcolor: "#fafafa", minHeight: "calc(100vh - 64px)", pb: 6 }}>
      <Container maxWidth="xl" sx={{ pt: 4, pb: 6 }}>
        
        {/* Title & Mode Toggle */}
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 4 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: "#1a2530", mb: 0.5 }}>
              Phân tích Tương quan Giao thông 📊
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Phân tích mối quan hệ không gian - thời gian giữa các nút giao thông ({nodesQuery.data?.length ?? "..."} nút giao)
            </Typography>
          </Box>

          <Stack direction="row" spacing={2} alignItems="center">
            {/* Active state chips */}
            {pageMode === "historical" && selectedDate && selectedSlot && (
              <Chip
                size="small"
                icon={<AccessTimeIcon sx={{ fontSize: "13px !important" }} />}
                label={`${dateToShort(selectedDate)} · ${slotToTime(selectedSlot)}`}
                color="primary"
                sx={{ fontWeight: 700, fontSize: "0.72rem" }}
              />
            )}
            {pageMode === "forecast" && fctDate && fctSlot && (
              <Chip
                size="small"
                icon={<TrendingUpIcon sx={{ fontSize: "13px !important" }} />}
                label={`${dateToShort(fctDate)} · ${slotToTime(fctSlot)} +${horizonLabel(fctHorizon)}`}
                color="success"
                sx={{ fontWeight: 700, fontSize: "0.72rem" }}
              />
            )}

            {/* Mode Toggle */}
            <ToggleButtonGroup
              value={pageMode}
              exclusive
              onChange={(_, val) => {
                if (!val) return;
                setPageMode(val);
                if (val === "forecast") {
                  if (selectedNode) {
                    setFctNode(selectedNode);
                    const targetDate = fctDate || fctDates[0];
                    const vs = Array.from(new Set(fctAllSnapshots.filter((s) => s.date === targetDate).map((s) => s.slot))).sort();
                    let ts = fctSlot;
                    if (!ts || !vs.includes(ts)) ts = vs.includes("Slot_1100") ? "Slot_1100" : vs[0];
                    setFctDate(targetDate); setFctSlot(ts);
                    if (targetDate && ts) doFetchForecast(selectedNode, targetDate, ts, fctHorizon, fctFilters);
                  } else { setFctFocus(false); setFctNode(null); setFctData(null); }
                } else {
                  if (fctNode) {
                    setSelectedNode(fctNode);
                    const targetDate = selectedDate || dates[0];
                    const ts2 = Array.from(new Set(allSnapshots.filter((s) => s.date === targetDate).map((s) => s.slot))).sort();
                    const targetSlot = selectedSlot || (ts2.includes("Slot_0815") ? "Slot_0815" : ts2[0]);
                    const newMode = targetDate && targetSlot ? `${targetDate}_${targetSlot}` : currentSnapshotMode;
                    doFetchEgo(fctNode, newMode, filters);
                  } else { setFocusMode(false); setSelectedNode(null); setEgoData(null); }
                }
              }}
              size="small"
              sx={{
                bgcolor: "#fff",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                borderRadius: 2,
                "& .MuiToggleButton-root": { px: 2, py: 0.75, textTransform: "none", fontWeight: 700 },
                "& .Mui-selected[value='historical']": { bgcolor: "#1565c0 !important", color: "#fff !important" },
                "& .Mui-selected[value='forecast']": { bgcolor: "#2e7d32 !important", color: "#fff !important" },
              }}
            >
              <ToggleButton value="historical">
                <HistoryIcon sx={{ fontSize: 14, mr: 0.5 }} />Lịch sử
              </ToggleButton>
              <ToggleButton value="forecast">
                <TrendingUpIcon sx={{ fontSize: 14, mr: 0.5 }} />Dự báo T+h
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Box>

        {/* Sliders Control Panel */}
        <Box sx={{ mb: 3 }}>
          {pageMode === "historical" && (
            snapshotsQuery.isLoading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 2, bgcolor: "#fff", borderRadius: 3, border: "1px solid #e2e8f0" }}>
                <CircularProgress size={14} />
                <Typography variant="caption" color="text.secondary">Đang tải snapshot...</Typography>
              </Box>
            ) : dates.length > 0 ? (
              <SnapshotSelector
                dates={dates} slots={slots}
                selectedDate={selectedDate} selectedSlot={selectedSlot}
                onChange={handleSnapshotChange} disabled={egoLoading}
              />
            ) : (
              <Box sx={{ p: 2, bgcolor: "#fff", borderRadius: 3, border: "1px dashed #ef4444" }}>
                <Typography variant="caption" color="warning.main" fontWeight={700}>
                  ⚠ Chưa có snapshot. Chạy seed_correlation.py trước.
                </Typography>
              </Box>
            )
          )}

          {pageMode === "forecast" && (
            fctSnapshotsQuery.isLoading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 2, bgcolor: "#fff", borderRadius: 3, border: "1px solid #e2e8f0" }}>
                <CircularProgress size={14} />
                <Typography variant="caption" color="text.secondary">Đang tải DMFM snapshots...</Typography>
              </Box>
            ) : fctDates.length > 0 ? (
              <Stack direction={{ xs: "column", lg: "row" }} spacing={3} sx={{ width: "100%" }}>
                <Box sx={{ flex: 6 }}>
                  <ForecastTimePicker
                    dates={fctDates} slots={fctSlots}
                    selectedDate={fctDate} selectedSlot={fctSlot}
                    onChange={handleFctTimeChange} disabled={fctLoading}
                  />
                </Box>
                <Box sx={{ flex: 4 }}>
                  <HorizonSlider horizon={fctHorizon} onChange={handleFctHorizonChange} />
                </Box>
              </Stack>
            ) : (
              <Box sx={{ p: 2, bgcolor: "#fff", borderRadius: 3, border: "1px dashed #ef4444" }}>
                <Typography variant="caption" color="warning.main" fontWeight={700}>
                  ⚠ DMFM model chưa sẵn sàng.
                </Typography>
              </Box>
            )
          )}
        </Box>

        {/* Map & Results Section */}
        <Stack spacing={3}>
          {/* Map Card */}
          <Card
            variant="outlined"
            sx={{
              borderRadius: 3,
              overflow: "hidden",
              border: "1px solid #e2e8f0",
              height: 700,
              position: "relative",
              boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
            }}
          >
            {(isLoading || egoLoading || fctLoading) && (
              <LinearProgress
                color={pageMode === "forecast" ? "success" : "primary"}
                sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, zIndex: 1300 }}
              />
            )}
            {isLoading && (
              <Box sx={{
                position: "absolute", inset: 0, zIndex: 1200,
                bgcolor: "rgba(255,255,255,0.72)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5,
              }}>
                <CircularProgress size={28} />
                <Typography variant="body2" fontWeight={600}>Đang tải dữ liệu mạng lưới...</Typography>
              </Box>
            )}
            {(egoLoading || fctLoading) && (
              <Box sx={{
                position: "absolute", inset: 0, zIndex: 1200,
                bgcolor: "rgba(255,255,255,0.25)", backdropFilter: "blur(2px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexDirection: "column", gap: 1.5,
              }}>
                <CircularProgress size={28} color={pageMode === "forecast" ? "success" : "primary"} />
                <Typography
                  variant="caption" fontWeight={800}
                  sx={{
                    color: pageMode === "forecast" ? "success.dark" : "primary.dark",
                    bgcolor: "background.paper", px: 2, py: 0.75,
                    borderRadius: 2, boxShadow: 1, border: "1px solid", borderColor: "divider",
                  }}
                >
                  {pageMode === "forecast" ? "Đang dự báo tương quan..." : "Đang tải tương quan..."}
                </Typography>
              </Box>
            )}

            <NodeCorrelationMap
              nodes={nodesQuery.data ?? []}
              edges={edgesQuery.data ?? []}
              egoData={pageMode === "historical" ? egoData : fctData ? {
                selected: fctData.selectedNode
                  ? { ...fctData.selectedNode, lng: fctData.selectedNode.lon ?? fctData.selectedNode.lng }
                  : null,
                neighbors: fctData.neighbors.map((n) => ({ ...n, lng: n.lon ?? n.lng })),
                total: fctData.total,
              } : null}
              focusMode={activeFocus}
              onNodeClick={handleNodeClick}
              onMapClick={handleMapClick}
              viewportKey={viewportKey}
              viewportOffsetX={0}
              sidebarOpen={pageMode === "historical" ? showSidebar : showFctSidebar}
            />

            <Box sx={{ position: "absolute", bottom: 44, right: 10, zIndex: 1100 }}>
              {pageMode === "historical" ? (
                <FilterOverlay filters={filters} onFilterChange={handleFilterChange} />
              ) : (
                <FilterOverlay filters={fctFilters} onFilterChange={handleFctFilterChange} />
              )}
            </Box>

            <Box sx={{ position: "absolute", bottom: 10, left: 10, zIndex: 1100 }}>
              <MapLegend focusMode={activeFocus} />
            </Box>
          </Card>

          {/* Results Panel */}
          {pageMode === "historical" ? (
            <Card variant="outlined" sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
              <EgoResultsPanel
                selectedNode={selectedNode}
                egoData={egoData}
                egoLoading={egoLoading}
                onReset={handleMapClick}
                nodeLookup={nodeLookup}
              />
            </Card>
          ) : (
            (fctNode || fctData) && (
              <Card variant="outlined" sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
                <ForecastEgoSidebar
                  selectedNode={fctNode}
                  forecastData={fctData}
                  horizon={fctHorizon}
                  onReset={handleMapClick}
                  filters={fctFilters}
                  onFilterChange={handleFctFilterChange}
                  nodeLookup={nodeLookup}
                  isLoading={fctLoading}
                />
              </Card>
            )
          )}
        </Stack>
      </Container>
    </Box>
  );
}