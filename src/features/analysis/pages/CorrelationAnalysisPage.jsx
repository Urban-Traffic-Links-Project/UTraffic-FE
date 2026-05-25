/**
 * CorrelationAnalysisPage.jsx — Trang phân tích tương quan
 *
 * Mode 1 — Lịch sử (Historical):
 *   Chọn ngày + slot → xem tương quan thực tế từ DB
 *
 * Mode 2 — Dự báo T+h (Forecast):
 *   Chọn T (ngày + slot) → chọn horizon 0..9 (0..135p bước 15p)
 *   → DMFM predict online → hiển thị tương quan dự báo
 */
import {
  Box, Chip, CircularProgress, Divider, ToggleButton, ToggleButtonGroup,
  Paper, Slider, Stack, Typography, IconButton, Tooltip, Slide, Button, LinearProgress,
} from "@mui/material";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import HistoryIcon from "@mui/icons-material/History";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import { correlationApi } from "../api/correlationApi.index";
import { NodeCorrelationMap } from "../components/Correlation/NodeCorrelationMap";
import {
  HorizonSlider,
  ForecastTimePicker,
  ForecastEgoSidebar,
  horizonLabel,
  horizonColor,
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

/** Chuyển "Slot_0900" → "09:00" */
function slotToTime(slot) {
  if (!slot) return "";
  const code = slot.replace("Slot_", ""); // "0900"
  return `${code.slice(0, 2)}:${code.slice(2)}`;
}

/** Chuyển "2024-08-27" → "27/08" */
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

// ─── Snapshot Selector (date + slot sliders) ───────────────────────────────
function SnapshotSelector({ dates, slots, selectedDate, selectedSlot, onChange, disabled }) {
  const dateIdx = dates.indexOf(selectedDate);
  const slotIdx = slots.indexOf(selectedSlot);

  // Local draft state — chỉ commit khi thả chuột (onChangeCommitted)
  const [draftDateIdx, setDraftDateIdx] = useState(Math.max(0, dateIdx));
  const [draftSlotIdx, setDraftSlotIdx] = useState(Math.max(0, slotIdx));

  // Sync draft khi prop thay đổi từ bên ngoài (ví dụ auto-select active snapshot khi load)
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
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        p: 2.5,
        background: "linear-gradient(135deg, rgba(25,118,210,0.04) 0%, rgba(21,101,192,0.02) 100%)",
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <AccessTimeIcon sx={{ fontSize: 18, color: "primary.main" }} />
        <Typography variant="subtitle2" fontWeight={800} color="primary.main">
          Chọn thời điểm phân tích
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Chip
          size="small"
          label={selectedDate && selectedSlot 
            ? `${dateToShort(selectedDate)} · ${slotToTime(selectedSlot)}` 
            : "..."}
          color="primary"
          sx={{ fontWeight: 700, fontSize: "0.75rem" }}
        />
      </Box>

      {/* Date slider */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
          <CalendarTodayIcon sx={{ fontSize: 14, color: "text.secondary" }} />
          <Typography variant="caption" color="text.secondary" fontWeight={700}>
            NGÀY
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
            {draftDate}
          </Typography>
        </Box>
        <Slider
          disabled={disabled || dates.length === 0}
          min={0}
          max={Math.max(0, dates.length - 1)}
          step={1}
          value={draftDateIdx}
          onChange={(_, v) => setDraftDateIdx(v)}
          onChangeCommitted={(_, v) => onChange(dates[v], slots[draftSlotIdx] ?? selectedSlot)}
          marks={dates.map((d, i) => ({ value: i, label: dateToShort(d) }))}
          valueLabelDisplay="off"
          sx={{
            "& .MuiSlider-markLabel": { fontSize: "0.65rem", color: "text.secondary" },
            "& .MuiSlider-mark": { height: 6 },
          }}
        />
      </Box>

      {/* Slot slider */}
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
          <AccessTimeIcon sx={{ fontSize: 14, color: "text.secondary" }} />
          <Typography variant="caption" color="text.secondary" fontWeight={700}>
            KHUNG GIỜ (15 phút)
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
            {slotToTime(draftSlot)}
          </Typography>
        </Box>
        <Slider
          disabled={disabled || slots.length === 0}
          min={0}
          max={Math.max(0, slots.length - 1)}
          step={1}
          value={draftSlotIdx}
          onChange={(_, v) => setDraftSlotIdx(v)}
          onChangeCommitted={(_, v) => onChange(dates[draftDateIdx] ?? selectedDate, slots[v])}
          marks={slots
            .filter((_, i) => i % 3 === 0)
            .map((s) => ({
              value: slots.indexOf(s),
              label: slotToTime(s),
            }))}
          valueLabelDisplay="auto"
          valueLabelFormat={(v) => slotToTime(slots[v] ?? "")}
          sx={{
            "& .MuiSlider-markLabel": { fontSize: "0.65rem", color: "text.secondary" },
            "& .MuiSlider-mark": { height: 6 },
          }}
        />
      </Box>
    </Paper>
  );
}

// ─── Ego Sidebar ──────────────────────────────────────────────────────────────
function EgoSidebar({ selectedNode, egoData, onReset, filters, onFilterChange, nodeLookup, egoLoading }) {
  const [draftFilters, setDraftFilters] = useState(filters);

  // Sync draftFilters khi filters từ props thay đổi (reset từ bên ngoài)
  useEffect(() => { setDraftFilters(filters); }, [filters]);

  function commitFilters(nextFilters) {
    setDraftFilters(nextFilters);
    if (nextFilters.maxDist === filters.maxDist && nextFilters.minCorr === filters.minCorr) return;
    onFilterChange(nextFilters);
  }

  // ── Phần bộ lọc — luôn hiển thị ──────────────────────────────────────────
  const filterPanel = (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
        <FilterAltIcon sx={{ fontSize: 15, color: "text.secondary" }} />
        <Typography variant="caption" color="text.secondary" fontWeight={700}>
          BỘ LỌC EGO-NETWORK
        </Typography>
      </Box>

      <Typography variant="caption" color="text.secondary">
        Phạm vi: <b>{draftFilters.maxDist} m</b>
      </Typography>
      <Slider
        size="small" min={200} max={3000} step={100}
        value={draftFilters.maxDist}
        onChange={(_, v) => setDraftFilters((prev) => ({ ...prev, maxDist: v }))}
        onChangeCommitted={(_, v) => commitFilters({ ...draftFilters, maxDist: v })}
        valueLabelDisplay="auto"
        sx={{ mt: 0.5, mb: 1.5 }}
      />

      <Typography variant="caption" color="text.secondary">
        |Corr| tối thiểu: <b>{draftFilters.minCorr.toFixed(1)}</b>
      </Typography>
      <Slider
        size="small" min={0} max={1} step={0.1}
        value={draftFilters.minCorr}
        onChange={(_, v) => setDraftFilters((prev) => ({ ...prev, minCorr: v }))}
        onChangeCommitted={(_, v) => commitFilters({ ...draftFilters, minCorr: v })}
        valueLabelDisplay="auto"
        sx={{ mt: 0.5 }}
      />

      <Stack direction="row" spacing={0.75} sx={{ mt: 1.25, flexWrap: "wrap", rowGap: 0.75 }}>
        {EGO_FILTER_PRESETS.map((preset) => {
          const active = draftFilters.maxDist === preset.maxDist && draftFilters.minCorr === preset.minCorr;
          return (
            <Chip
              key={preset.label} size="small" label={preset.label}
              color={active ? "primary" : "default"}
              variant={active ? "filled" : "outlined"}
              onClick={() => commitFilters({ maxDist: preset.maxDist, minCorr: preset.minCorr })}
            />
          );
        })}
        <Button size="small" variant="text"
          onClick={() => commitFilters({ maxDist: 1000, minCorr: 0.5 })}
          sx={{ minWidth: "auto", px: 1 }}
        >Reset</Button>
      </Stack>
    </Box>
  );

  // ── Placeholder khi chưa chọn node ────────────────────────────────────────
  if (!selectedNode) {
    return (
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          p: 2.5,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {filterPanel}
        <Divider />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.5,
            py: 3,
            bgcolor: "rgba(25,118,210,0.02)",
            borderRadius: 2,
            border: "1px dashed",
            borderColor: "divider",
          }}
        >
          <MyLocationIcon sx={{ fontSize: 36, color: "text.disabled" }} />
          <Typography variant="body2" color="text.secondary" fontWeight={600} textAlign="center">
            Hãy chọn node bạn muốn xem
          </Typography>
          <Typography variant="caption" color="text.disabled" textAlign="center">
            Click vào một nút giao trên bản đồ
          </Typography>
        </Box>
      </Paper>
    );
  }

  // ── Loading overlay khi đang re-fetch snapshot ─────────────────────────────
  // (giữ egoData cũ, chỉ show spinner nhỏ ở header)
  const selectedDisplayName = getNodeDisplayName(selectedNode);

  if (!egoData) {
    // Đang fetch lần đầu cho node này (chưa có data cũ)
    return (
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          p: 2.5,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {filterPanel}
        <Divider />
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, py: 3 }}>
          <CircularProgress size={28} />
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            Đang tính tương quan...
          </Typography>
        </Box>
      </Paper>
    );
  }

  const { neighbors } = egoData;
  const top10 = [...neighbors].slice(0, 10);

  const strongestNeighbor = top10[0] ?? null;
  const avgAbsCorr = neighbors.length
    ? neighbors.reduce((sum, n) => sum + Math.abs(n.corr ?? 0), 0) / neighbors.length
    : 0;

  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        p: 2.5,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top linear progress during loading */}
      {egoLoading && (
        <LinearProgress
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
          }}
        />
      )}

      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <MyLocationIcon sx={{ color: "#ff6f00", fontSize: 20 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="subtitle2" fontWeight={800} noWrap>
              {selectedDisplayName}
            </Typography>
            {egoLoading && (
              <CircularProgress size={16} sx={{ color: "primary.main" }} />
            )}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
            OSM ID: {selectedNode.osm_node_id}
          </Typography>
        </Box>
        <Tooltip title="Thoát focus">
          <IconButton size="small" onClick={onReset}>
            <ZoomOutMapIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Sidebar Content Body (dimmed during loading) */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          flex: 1,
          overflow: "hidden",
          opacity: egoLoading ? 0.55 : 1,
          pointerEvents: egoLoading ? "none" : "auto",
          transition: "all 0.2s ease-in-out",
        }}
      >
        {/* Snapshot badge */}
        {egoData.snapshot_mode && (
          <Box
            sx={{
              px: 1.5, py: 0.75,
              bgcolor: "rgba(25,118,210,0.08)",
              borderRadius: 2,
              border: "1px solid rgba(25,118,210,0.2)",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <AccessTimeIcon sx={{ fontSize: 14, color: "primary.main" }} />
            <Typography variant="caption" color="primary.main" fontWeight={700}>
              {egoData.snapshot_date} · {slotToTime(egoData.snapshot_slot)}
            </Typography>
          </Box>
        )}

        <Divider />

        {/* Filter controls — dùng lại filterPanel đã tạo ở trên */}
        {filterPanel}

        <Divider />

        {/* Stats */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Chip size="small" label={`${neighbors.length} neighbors`} color="primary" variant="outlined" />
          <Chip size="small" label={`${neighbors.filter((n) => n.is_adjacent).length} adjacent`} variant="outlined" />
          <Chip size="small" label={`|corr| TB ${avgAbsCorr.toFixed(2)}`} variant="outlined" />
        </Box>

        {strongestNeighbor && (
          <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: "rgba(255,111,0,0.08)", border: "1px solid rgba(255,111,0,0.18)" }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              TƯƠNG QUAN MẠNH NHẤT
            </Typography>
            <Typography variant="body2" fontWeight={700} noWrap>
              {getNodeDisplayName(nodeLookup.get(strongestNeighbor.osm_node_id) ?? strongestNeighbor)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {strongestNeighbor.dist_m}m · {strongestNeighbor.corr >= 0 ? "+" : ""}
              {strongestNeighbor.corr.toFixed(3)} · {corrLabel(strongestNeighbor.corr)}
            </Typography>
          </Box>
        )}

        {/* Top 10 list */}
        <Box sx={{ flex: 1, overflow: "auto" }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mb: 1, display: "block" }}>
            TOP 10 TƯƠNG QUAN CAO NHẤT
          </Typography>
          {egoData.is_error ? (
            <Box sx={{ p: 2, borderRadius: 2, border: "1px dashed", borderColor: "error.main", bgcolor: "rgba(211,47,47,0.05)" }}>
              <Typography variant="body2" fontWeight={700} color="error.main">Không có dữ liệu (404)</Typography>
              <Typography variant="caption" color="error.main">
                Thời điểm này chưa có dữ liệu tương quan (có thể do khoảng thời gian warm-up của model). Vui lòng chọn khung giờ khác.
              </Typography>
            </Box>
          ) : top10.length ? (
            <Stack spacing={0.75}>
              {top10.map((nb, i) => (
                <Box key={nb.id} sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, borderRadius: 2, bgcolor: "action.hover" }}>
                  <Typography variant="caption" sx={{ width: 20, textAlign: "center", fontWeight: 800, color: "text.secondary" }}>
                    {i + 1}
                  </Typography>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" noWrap sx={{ fontWeight: 600, display: "block" }}>
                      {getNodeDisplayName(nodeLookup.get(nb.osm_node_id) ?? nb)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      OSM {nb.osm_node_id} · {nb.dist_m}m · {nb.is_adjacent ? "adjacent" : "non-adj"}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="caption" sx={{ fontWeight: 900, fontSize: "0.75rem", color: corrColor(nb.corr), display: "block" }}>
                      {nb.corr >= 0 ? "+" : ""}{nb.corr.toFixed(3)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: corrColor(nb.corr), fontSize: "0.65rem" }}>
                      {corrLabel(nb.corr)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          ) : (
            <Box sx={{ p: 2, borderRadius: 2, border: "1px dashed", borderColor: "divider", bgcolor: "background.default" }}>
              <Typography variant="body2" fontWeight={700}>Không có node phù hợp bộ lọc</Typography>
              <Typography variant="caption" color="text.secondary">
                Hãy tăng phạm vi hoặc giảm ngưỡng |corr|.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────
function MapLegend({ focusMode }) {
  return (
    <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, px: 2, py: 1.5, display: "flex", gap: 2.5, flexWrap: "wrap", alignItems: "center" }}>
      <Typography variant="caption" fontWeight={700} color="text.secondary">LEGEND</Typography>
      {focusMode ? (
        <>
          {[
            { color: "#ff6f00", label: "Node chọn" },
            { color: "#d32f2f", label: "|corr| ≥ 0.8" },
            { color: "#f57c00", label: "|corr| ≥ 0.6" },
            { color: "#fbc02d", label: "|corr| ≥ 0.4" },
            { color: "#388e3c", label: "|corr| < 0.4" },
            { color: "#b0bec5", label: "Ngoài vùng" },
          ].map(({ color, label }) => (
            <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: color }} />
              <Typography variant="caption">{label}</Typography>
            </Box>
          ))}
        </>
      ) : (
        <>
          {[
            { color: "#7dd3fc", label: "Mức thấp < 3" },
            { color: "#f59e0b", label: "3 ≤ Trung bình < 4" },
            { color: "#2563eb", label: "4 ≤ Cao < 5" },
            { color: "#ef4444", label: "5 ≤ Node trục chính" },
          ].map(({ color, label }) => (
            <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: color }} />
              <Typography variant="caption">{label}</Typography>
            </Box>
          ))}
          <Typography variant="caption" color="text.secondary">Click để xem tương quan</Typography>
        </>
      )}
    </Paper>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function CorrelationAnalysisPage() {
  // ── Mode: "historical" | "forecast" ────────────────────────────────────────
  const [pageMode, setPageMode] = useState("historical");

  // ── Historical state ────────────────────────────────────────────────────────
  const [selectedNode, setSelectedNode] = useState(null);
  const [focusMode, setFocusMode]       = useState(false);
  const [egoData, setEgoData]           = useState(null);
  const [egoLoading, setEgoLoading]     = useState(false);
  const [filters, setFilters]           = useState({ maxDist: 500, minCorr: 0.3 });
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // ── Forecast state ──────────────────────────────────────────────────────────
  const [fctNode, setFctNode]         = useState(null);
  const [fctFocusMode, setFctFocus]   = useState(false);
  const [fctData, setFctData]         = useState(null);
  const [fctLoading, setFctLoading]   = useState(false);
  const [fctFilters, setFctFilters]   = useState({ maxDist: 1000, minCorr: 0.3 });
  const [fctHorizon, setFctHorizon]   = useState(1);
  const [fctDate, setFctDate]         = useState(null);
  const [fctSlot, setFctSlot]         = useState(null);

  // ── Fetch nodes + edges (shared) ───────────────────────────────────────────
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

  // ── Historical: fetch snapshots ─────────────────────────────────────────────
  const snapshotsQuery = useQuery({
    queryKey: ["corr-snapshots"],
    queryFn: () => correlationApi.fetchSnapshots(),
    staleTime: 5 * 60_000,
  });

  // ── Forecast: fetch snapshots ───────────────────────────────────────────────
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
    if (!snapshotsQuery.data || !snapshotsQuery.data.snapshots || snapshotsQuery.data.snapshots.length === 0) return;
    const data = snapshotsQuery.data;
    const currentDayValid = selectedDate && slots.includes(selectedSlot);
    if (!selectedDate || !selectedSlot || !currentDayValid) {
      const nextDate = selectedDate || data.dates[0];
      const nextSlots = allSnapshots.filter((s) => s.date === nextDate).map((s) => s.slot);
      const uniqueNextSlots = Array.from(new Set(nextSlots)).sort();
      if (uniqueNextSlots.length > 0) {
        setSelectedDate(nextDate);
        const preferredSlot = uniqueNextSlots.includes("Slot_0815") ? "Slot_0815" : uniqueNextSlots[0];
        setSelectedSlot(preferredSlot);
      }
    }
  }, [snapshotsQuery.data, selectedDate, selectedSlot, slots, allSnapshots]);

  // Auto-select forecast default
  useEffect(() => {
    if (!fctSnapshotsQuery.data || !fctSnapshotsQuery.data.snapshots || fctSnapshotsQuery.data.snapshots.length === 0) return;
    const data = fctSnapshotsQuery.data;
    const currentDayValid = fctDate && fctSlots.includes(fctSlot);
    if (!fctDate || !fctSlot || !currentDayValid) {
      const nextDate = fctDate || data.dates[0];
      const nextSlots = fctAllSnapshots.filter((s) => s.date === nextDate).map((s) => s.slot);
      const uniqueNextSlots = Array.from(new Set(nextSlots)).sort();
      if (uniqueNextSlots.length > 0) {
        setFctDate(nextDate);
        const preferredSlot = uniqueNextSlots.includes("Slot_1100") ? "Slot_1100" : uniqueNextSlots[0];
        setFctSlot(preferredSlot);
      }
    }
  }, [fctSnapshotsQuery.data, fctDate, fctSlot, fctSlots, fctAllSnapshots]);

  const currentSnapshotMode = selectedDate && selectedSlot ? `${selectedDate}_${selectedSlot}` : null;

  // ── Historical handlers ─────────────────────────────────────────────────────
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
        selected: node,
        neighbors: [],
        total: 0,
        is_error: true,
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
    setFocusMode(false);
    setSelectedNode(null);
    setEgoData(null);
    setFctFocus(false);
    setFctNode(null);
    setFctData(null);
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
    const newMode = `${newDate}_${newSlot}`;
    await doFetchEgo(selectedNode, newMode, filters);
  }, [selectedNode, focusMode, doFetchEgo, filters]);

  // ── Forecast handlers ───────────────────────────────────────────────────────
  const doFetchForecast = useCallback(async (node, date, slot, horizon, ffilters) => {
    if (!node || !date || !slot) return;
    setFctLoading(true);
    try {
      const data = await forecastApi.fetchForecastNode(
        node.osm_node_id, date, slot, horizon,
        { max_dist_m: ffilters.maxDist || undefined, min_corr: ffilters.minCorr || undefined }
      );
      setFctData(data);
      setFctFocus(true);
    } catch (err) {
      console.error("fetchForecast error:", err);
      setFctData(null);
      setFctFocus(false);
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
    const validSlots = fctAllSnapshots.filter((s) => s.date === newDate).map((s) => s.slot);
    const uniqueValidSlots = Array.from(new Set(validSlots)).sort();
    let targetSlot = newSlot;
    if (uniqueValidSlots.length > 0 && !uniqueValidSlots.includes(newSlot)) {
      targetSlot = uniqueValidSlots.includes("Slot_1100") ? "Slot_1100" : uniqueValidSlots[0];
    }

    setFctDate(newDate);
    setFctSlot(targetSlot);
    if (!fctNode || !fctFocusMode) return;
    doFetchForecast(fctNode, newDate, targetSlot, fctHorizon, fctFilters);
  }, [fctNode, fctFocusMode, fctHorizon, fctFilters, doFetchForecast, fctAllSnapshots]);

  const handleFctFilterChange = useCallback((newFilters) => {
    setFctFilters(newFilters);
    if (!fctNode || !fctDate || !fctSlot) return;
    doFetchForecast(fctNode, fctDate, fctSlot, fctHorizon, newFilters);
  }, [fctNode, fctDate, fctSlot, fctHorizon, doFetchForecast]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const isLoading    = nodesQuery.isLoading || edgesQuery.isLoading;
  const showSidebar  = focusMode && Boolean(egoData);
  const showFctSidebar = fctFocusMode && Boolean(fctData);
  const nodeLookup   = useMemo(
    () => new Map((nodesQuery.data ?? []).map((n) => [n.osm_node_id, n])),
    [nodesQuery.data]
  );

  // Active focus mode
  const activeFocus   = pageMode === "historical" ? focusMode   : fctFocusMode;
  const activeEgoData = pageMode === "historical" ? egoData     : fctData;
  const activeNode    = pageMode === "historical" ? selectedNode : fctNode;

  const viewportKey = useMemo(() => {
    if (!activeFocus || !activeEgoData?.selectedNode) return "free";
    return `${activeEgoData.selectedNode.osm_node_id}:${pageMode}:${fctHorizon}`;
  }, [activeFocus, activeEgoData, pageMode, fctHorizon]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>

      {/* ── Header + Mode Toggle ───────────────────────────────────────── */}
      <Box sx={{ mb: 2.5, display: "flex", alignItems: "flex-start", gap: 2, flexWrap: "wrap" }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={900} gutterBottom>
            Phân tích tương quan giao thông
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {activeFocus
              ? "Đang xem kết quả. Click vào nền bản đồ để thoát."
              : `${nodesQuery.data?.length ?? "..."} nodes · Chọn thời điểm rồi click node`}
          </Typography>
        </Box>

        {/* Mode toggle */}
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
                const validSlots = fctAllSnapshots.filter((s) => s.date === targetDate).map((s) => s.slot);
                const uniqueValidSlots = Array.from(new Set(validSlots)).sort();
                let targetSlot = fctSlot;
                if (!targetSlot || !uniqueValidSlots.includes(targetSlot)) {
                  targetSlot = uniqueValidSlots.includes("Slot_1100") ? "Slot_1100" : uniqueValidSlots[0];
                }
                setFctDate(targetDate);
                setFctSlot(targetSlot);
                if (targetDate && targetSlot) {
                  doFetchForecast(selectedNode, targetDate, targetSlot, fctHorizon, fctFilters);
                }
              } else {
                setFctFocus(false);
                setFctNode(null);
                setFctData(null);
              }
            } else if (val === "historical") {
              if (fctNode) {
                setSelectedNode(fctNode);
                const targetDate = selectedDate || dates[0];
                const targetSlots = allSnapshots.filter((s) => s.date === targetDate).map((s) => s.slot);
                const uniqueTargetSlots = Array.from(new Set(targetSlots)).sort();
                const targetSlot = selectedSlot || (uniqueTargetSlots.includes("Slot_0815") ? "Slot_0815" : uniqueTargetSlots[0]);
                const newMode = targetDate && targetSlot ? `${targetDate}_${targetSlot}` : currentSnapshotMode;
                doFetchEgo(fctNode, newMode, filters);
              } else {
                setFocusMode(false);
                setSelectedNode(null);
                setEgoData(null);
              }
            }
          }}
          size="small"
          sx={{
            "& .MuiToggleButton-root": { px: 2, py: 0.75, textTransform: "none", fontWeight: 700, fontSize: "0.8rem" },
            "& .Mui-selected[value='historical']": { bgcolor: "#1565c0 !important", color: "#fff !important" },
            "& .Mui-selected[value='forecast']": { bgcolor: "#2e7d32 !important", color: "#fff !important" },
          }}
        >
          <ToggleButton value="historical">
            <HistoryIcon sx={{ fontSize: 16, mr: 0.75 }} />
            Lịch sử
          </ToggleButton>
          <ToggleButton value="forecast">
            <TrendingUpIcon sx={{ fontSize: 16, mr: 0.75 }} />
            Dự báo T+h
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* ── Historical mode controls ────────────────────────────────────── */}
      {pageMode === "historical" && (
        <Box sx={{ mb: 2 }}>
          {snapshotsQuery.isLoading ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 2 }}>
              <CircularProgress size={16} />
              <Typography variant="caption" color="text.secondary">Đang tải snapshot...</Typography>
            </Box>
          ) : dates.length > 0 ? (
            <SnapshotSelector
              dates={dates}
              slots={slots}
              selectedDate={selectedDate}
              selectedSlot={selectedSlot}
              onChange={handleSnapshotChange}
              disabled={egoLoading}
            />
          ) : (
            <Paper elevation={0} sx={{ p: 2, border: "1px dashed", borderColor: "warning.main", borderRadius: 2 }}>
              <Typography variant="body2" color="warning.main" fontWeight={700}>
                ⚠ Chưa có snapshot. Chạy seed_correlation.py trước.
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* ── Forecast mode controls ──────────────────────────────────────── */}
      {pageMode === "forecast" && (
        <Box sx={{ mb: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
          {fctSnapshotsQuery.isLoading ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 2 }}>
              <CircularProgress size={16} />
              <Typography variant="caption" color="text.secondary">Đang tải DMFM snapshots...</Typography>
            </Box>
          ) : fctDates.length > 0 ? (
            <>
              <ForecastTimePicker
                dates={fctDates}
                slots={fctSlots}
                selectedDate={fctDate}
                selectedSlot={fctSlot}
                onChange={handleFctTimeChange}
                disabled={fctLoading}
              />
              <HorizonSlider horizon={fctHorizon} onChange={handleFctHorizonChange} />
            </>
          ) : (
            <Paper elevation={0} sx={{ p: 2, border: "1px dashed", borderColor: "warning.main", borderRadius: 2 }}>
              <Typography variant="body2" color="warning.main" fontWeight={700}>
                ⚠ DMFM model chưa sẵn sàng. Kiểm tra ml_workspace/data/dmfm_model/.
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* ── Main layout ─────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 320px" },
          gap: 2.5,
          alignItems: "start",
        }}
      >
        {/* Left: bản đồ */}
        <Box>
          <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden", position: "relative" }}>
            {(isLoading || egoLoading || fctLoading) && (
              <LinearProgress
                color={pageMode === "forecast" ? "success" : "primary"}
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  zIndex: 1100,
                }}
              />
            )}
            {isLoading && (
              <Box sx={{ position: "absolute", inset: 0, zIndex: 1000, bgcolor: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5 }}>
                <CircularProgress size={28} />
                <Typography variant="body2" fontWeight={600}>Đang tải dữ liệu...</Typography>
              </Box>
            )}
            {(egoLoading || fctLoading) && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 1000,
                  bgcolor: "rgba(255, 255, 255, 0.4)",
                  backdropFilter: "blur(2px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: 1.5,
                  transition: "all 0.3s ease",
                }}
              >
                <CircularProgress size={32} color={pageMode === "forecast" ? "success" : "primary"} />
                <Typography
                  variant="caption"
                  fontWeight={800}
                  sx={{
                    color: pageMode === "forecast" ? "success.dark" : "primary.dark",
                    bgcolor: "background.paper",
                    px: 2,
                    py: 0.75,
                    borderRadius: 2,
                    boxShadow: 1,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  {pageMode === "forecast" ? "Đang dự báo tương quan..." : "Đang tải dữ liệu tương quan..."}
                </Typography>
              </Box>
            )}
            <NodeCorrelationMap
              nodes={nodesQuery.data ?? []}
              edges={edgesQuery.data ?? []}
              egoData={pageMode === "historical" ? egoData : fctData ? {
                // Adapter: map forecast data shape → egoData shape for map rendering
                selected: fctData.selectedNode
                  ? { ...fctData.selectedNode, lng: fctData.selectedNode.lon ?? fctData.selectedNode.lng }
                  : null,
                neighbors: fctData.neighbors.map((n) => ({ ...n, lng: n.lon ?? n.lng })),
                total: fctData.total,
              } : null}
              focusMode={activeFocus}
              onNodeClick={handleNodeClick}
              onMapClick={handleMapClick}
              height={activeFocus ? 600 : 540}
              viewportKey={viewportKey}
              viewportOffsetX={(pageMode === "historical" ? showSidebar : showFctSidebar) ? 160 : 0}
              sidebarOpen={pageMode === "historical" ? showSidebar : showFctSidebar}
            />
          </Paper>

          <Box sx={{ mt: 1.5 }}>
            <MapLegend focusMode={activeFocus} />
          </Box>
        </Box>

        {/* Right: sidebar */}
        <Box sx={{ minWidth: 0 }}>
          {pageMode === "historical" ? (
            <EgoSidebar
              selectedNode={selectedNode}
              egoData={egoData}
              onReset={handleMapClick}
              filters={filters}
              onFilterChange={handleFilterChange}
              nodeLookup={nodeLookup}
              egoLoading={egoLoading}
            />
          ) : (
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
          )}
        </Box>
      </Box>
    </Box>
  );
}