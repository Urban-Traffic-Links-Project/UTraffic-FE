/**
 * CorrelationAnalysisPage.jsx — Trang phân tích tương quan
 *
 * Flow:
 *  1. Load trang → fetch nodes + edges + snapshots → render bản đồ
 *  2. User chọn ngày + slot qua slider → snapshot_mode được chọn
 *  3. Click node → fetch ego-network cho snapshot đó → focus mode
 *  4. Click nền bản đồ → thoát focus mode
 */
import {
  Box, Chip, CircularProgress, Divider, ToggleButton, ToggleButtonGroup,
  Paper, Slider, Stack, Typography, IconButton, Tooltip, Slide, Button,
} from "@mui/material";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import { correlationApi } from "../api/correlationApi.index";
import { NodeCorrelationMap } from "../components/Correlation/NodeCorrelationMap";

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
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const idx = slots.indexOf(selectedSlot);
    if (idx >= 0) setDraftSlotIdx(idx);
  }, [selectedSlot]); // eslint-disable-line react-hooks/exhaustive-deps

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
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <MyLocationIcon sx={{ color: "#ff6f00", fontSize: 20 }} />
        <Box sx={{ flex: 1 }}>
          {egoLoading && (
            <CircularProgress size={12} sx={{ mr: 1, verticalAlign: "middle" }} />
          )}
          <Typography variant="subtitle2" fontWeight={800}>
            {selectedDisplayName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            OSM ID: {selectedNode.osm_node_id}
          </Typography>
        </Box>
        <Tooltip title="Thoát focus">
          <IconButton size="small" onClick={onReset}>
            <ZoomOutMapIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

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
        {top10.length ? (
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
  const [selectedNode, setSelectedNode] = useState(null);
  const [focusMode, setFocusMode]       = useState(false);
  const [egoData, setEgoData]           = useState(null);
  const [egoLoading, setEgoLoading]     = useState(false);
  const [filters, setFilters]           = useState({ maxDist: 1000, minCorr: 0.5 });

  // Snapshot selection state
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // ── Fetch nodes + edges + snapshots ────────────────────────────────────────
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

  // Thay thế onSuccess (v5) bằng useEffect để tự động chọn snapshot khi có data
  useEffect(() => {
    if (!snapshotsQuery.data) return;
    const data = snapshotsQuery.data;
    
    // Chỉ set nếu chưa chọn gì
    if (selectedDate && selectedSlot) return;

    // Luôn ưu tiên chọn ngày nhỏ nhất và khung giờ nhỏ nhất
    if (data.dates?.length > 0 && data.slots?.length > 0) {
      setSelectedDate(data.dates[0]);
      setSelectedSlot(data.slots[0]);
    }
  }, [snapshotsQuery.data, selectedDate, selectedSlot]);

  const dates = snapshotsQuery.data?.dates ?? [];
  const slots = snapshotsQuery.data?.slots ?? [];

  // mode_key hiện tại
  const currentSnapshotMode = selectedDate && selectedSlot
    ? `${selectedDate}_${selectedSlot}`
    : null;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const doFetchEgo = useCallback(async (node, snapshotMode, egoFilters) => {
    // Không xóa egoData cũ ngay — giữ để sidebar không biến mất khi re-fetch snapshot
    setEgoLoading(true);
    try {
      const data = await correlationApi.fetchCorrelation(node.osm_node_id, {
        max_dist_m:    egoFilters.maxDist,
        min_corr:      egoFilters.minCorr,
        snapshot_mode: snapshotMode ?? undefined,
      });
      setEgoData(data);
      setFocusMode(true);
    } catch (err) {
      console.error("fetchCorrelation error:", err);
      // Không clear egoData khi lỗi — giữ dữ liệu cũ
    } finally {
      setEgoLoading(false);
    }
  }, []);

  const handleNodeClick = useCallback(async (node) => {
    setSelectedNode(node);
    await doFetchEgo(node, currentSnapshotMode, filters);
  }, [doFetchEgo, currentSnapshotMode, filters]);

  const handleMapClick = useCallback(() => {
    setFocusMode(false);
    setSelectedNode(null);
    setEgoData(null);
  }, []);

  const handleFilterChange = useCallback(async (newFilters) => {
    setFilters(newFilters);
    if (!selectedNode) return;
    await doFetchEgo(selectedNode, currentSnapshotMode, newFilters);
  }, [selectedNode, doFetchEgo, currentSnapshotMode]);

  // Khi đổi snapshot (ngày / giờ) → re-fetch nếu đang focus
  const handleSnapshotChange = useCallback(async (newDate, newSlot) => {
    setSelectedDate(newDate);
    setSelectedSlot(newSlot);
    if (!selectedNode || !focusMode) return;
    const newMode = `${newDate}_${newSlot}`;
    await doFetchEgo(selectedNode, newMode, filters);
  }, [selectedNode, focusMode, doFetchEgo, filters]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const isLoading   = nodesQuery.isLoading || edgesQuery.isLoading;
  const showSidebar = focusMode && Boolean(egoData);
  const nodeLookup  = useMemo(
    () => new Map((nodesQuery.data ?? []).map((n) => [n.osm_node_id, n])),
    [nodesQuery.data]
  );
  const viewportKey = useMemo(() => {
    if (!focusMode || !egoData?.selected) return "free";
    return `${egoData.selected.osm_node_id}:${filters.maxDist}:${filters.minCorr}:${egoData.neighbors?.length ?? 0}`;
  }, [focusMode, egoData, filters]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5" fontWeight={900} gutterBottom>
          Phân tích tương quan giao thông
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {focusMode
            ? "Đang xem Ego-Network. Click vào nền bản đồ để thoát."
            : `${nodesQuery.data?.length ?? "..."} nodes · Chọn thời điểm rồi click vào node để xem tương quan`}
        </Typography>
      </Box>

      {/* ── Snapshot Selector ────────────────────────────────────────────── */}
      <Box sx={{ mb: 2 }}>
        {snapshotsQuery.isLoading ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 2 }}>
            <CircularProgress size={16} />
            <Typography variant="caption" color="text.secondary">Đang tải danh sách snapshot...</Typography>
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
              ⚠ Chưa có snapshot nào. Hãy chạy seed_correlation.py trước.
            </Typography>
          </Paper>
        )}
      </Box>

      {/* ── Main layout ──────────────────────────────────────────────────── */}
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
            {isLoading && (
              <Box sx={{ position: "absolute", inset: 0, zIndex: 1000, bgcolor: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5 }}>
                <CircularProgress size={28} />
                <Typography variant="body2" fontWeight={600}>Đang tải dữ liệu...</Typography>
              </Box>
            )}

            <NodeCorrelationMap
              nodes={nodesQuery.data ?? []}
              edges={edgesQuery.data ?? []}
              egoData={egoData}
              focusMode={focusMode}
              onNodeClick={handleNodeClick}
              onMapClick={handleMapClick}
              height={focusMode ? 600 : 540}
              viewportKey={viewportKey}
              viewportOffsetX={showSidebar ? 160 : 0}
              sidebarOpen={showSidebar}
            />
          </Paper>

          <Box sx={{ mt: 1.5 }}>
            <MapLegend focusMode={focusMode} />
          </Box>
        </Box>

        {/* Right: ego sidebar — luôn hiển thị */}
        <Box sx={{ minWidth: 0 }}>
          <EgoSidebar
            selectedNode={selectedNode}
            egoData={egoData}
            onReset={handleMapClick}
            filters={filters}
            onFilterChange={handleFilterChange}
            nodeLookup={nodeLookup}
            egoLoading={egoLoading}
          />
        </Box>
      </Box>
    </Box>
  );
}