/**
 * ForecastPanel.jsx
 *
 * Panel dự báo tương quan T+h sử dụng DMFM model.
 * Gồm:
 *   - ForecastTimePicker: chọn ngày + slot (thời điểm gốc T)
 *   - HorizonSlider: chọn horizon từ 0→135 phút (bước 15p)
 *   - ForecastEgoSidebar: hiển thị kết quả dự báo cho node được chọn
 */
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Slider,
  Stack,
  Typography,
  IconButton,
  Tooltip,
  LinearProgress,
  Grid,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import * as forecastApi from "../../api/forecastApi";

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

function slotToTime(slot) {
  if (!slot) return "";
  const code = slot.replace("Slot_", "");
  return `${code.slice(0, 2)}:${code.slice(2)}`;
}

function dateToShort(d) {
  if (!d) return "";
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
}

function getNodeDisplayName(node) {
  const s = node?.street_name?.trim();
  if (s) return s;
  if (Number.isFinite(node?.node_index)) return `Nút giao #${node.node_index + 1}`;
  if (node?.osm_node_id) return `OSM ${node.osm_node_id}`;
  return "Nút giao";
}

/** horizon (0..9) → label hiển thị */
function horizonLabel(h) {
  if (h === 0) return "Tại T (thực tế)";
  return `T+${h} (+${h * 15}p)`;
}

/** horizon (0..9) → màu badge */
function horizonColor(h) {
  if (h === 0) return "#1976d2";        // Blue — historical
  if (h <= 3)  return "#2e7d32";        // Green — gần
  if (h <= 6)  return "#f57c00";        // Orange — xa hơn
  return "#c62828";                      // Red — xa nhất
}

// ─── Slider marks ─────────────────────────────────────────────────────────────
const HORIZON_MARKS = Array.from({ length: 10 }, (_, i) => ({
  value: i,
  label: [0, 1, 3, 6, 9].includes(i) ? (i === 0 ? "0" : `${i * 15}p`) : "",
}));

// ─── HorizonSlider ────────────────────────────────────────────────────────────
function HorizonSlider({ horizon, onChange }) {
  const [draft, setDraft] = useState(horizon);

  useEffect(() => { setDraft(horizon); }, [horizon]);

  const color = horizonColor(draft);

  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        p: 2.5,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: draft === 0
          ? "linear-gradient(135deg, rgba(25,118,210,0.04) 0%, rgba(21,101,192,0.02) 100%)"
          : "linear-gradient(135deg, rgba(46,125,50,0.04) 0%, rgba(27,94,32,0.02) 100%)",
        transition: "background 0.3s ease",
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <TrendingUpIcon sx={{ fontSize: 18, color }} />
        <Typography variant="subtitle2" fontWeight={800} sx={{ color }}>
          Dự báo T+h
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Chip
          size="small"
          label={horizonLabel(draft)}
          sx={{
            fontWeight: 700,
            fontSize: "0.72rem",
            bgcolor: color,
            color: "#fff",
            border: "none",
          }}
        />
      </Box>

      {/* Slider */}
      <Box sx={{ px: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700}>
            HORIZON (bước 15 phút)
          </Typography>
          <Typography variant="caption" sx={{ color, fontWeight: 800 }}>
            {draft === 0 ? "Thực tế tại T" : `+${draft * 15} phút`}
          </Typography>
        </Box>
        <Slider
          min={0}
          max={9}
          step={1}
          value={draft}
          onChange={(_, v) => setDraft(v)}
          onChangeCommitted={(_, v) => onChange(v)}
          marks={HORIZON_MARKS}
          valueLabelDisplay="auto"
          valueLabelFormat={(v) => v === 0 ? "T" : `+${v * 15}p`}
          sx={{
            color,
            "& .MuiSlider-thumb": {
              backgroundColor: "#fff",
              border: `2px solid ${color}`,
              width: 18,
              height: 18,
            },
            "& .MuiSlider-markLabel": {
              fontSize: "0.65rem",
              color: "text.secondary",
            },
            "& .MuiSlider-mark": { height: 6 },
            "& .MuiSlider-valueLabel": {
              bgcolor: color,
              fontSize: "0.7rem",
            },
          }}
        />
      </Box>

      {/* Mô tả */}
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
        {draft === 0
          ? "📊 Hiển thị tương quan thực tế tại thời điểm T (không predict)"
          : `🔮 DMFM dự báo tương quan tại T + ${draft * 15} phút kể từ thời điểm T`}
      </Typography>
    </Paper>
  );
}

// ─── ForecastTimePicker ───────────────────────────────────────────────────────
function ForecastTimePicker({ dates, slots, selectedDate, selectedSlot, onChange, disabled }) {
  const dateIdx = dates.indexOf(selectedDate);
  const slotIdx = slots.indexOf(selectedSlot);
  const [draftDateIdx, setDraftDateIdx] = useState(Math.max(0, dateIdx));
  const [draftSlotIdx, setDraftSlotIdx] = useState(Math.max(0, slotIdx));

  useEffect(() => {
    const i = dates.indexOf(selectedDate);
    if (i >= 0) setDraftDateIdx(i);
  }, [selectedDate, dates]);

  useEffect(() => {
    const i = slots.indexOf(selectedSlot);
    if (i >= 0) setDraftSlotIdx(i);
  }, [selectedSlot, slots]);

  const draftDate = dates[draftDateIdx] ?? selectedDate;
  const draftSlot = slots[draftSlotIdx] ?? selectedSlot;

  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        p: 2.5,
        background: "linear-gradient(135deg, rgba(103,58,183,0.04) 0%, rgba(81,45,168,0.02) 100%)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {/* Row 1: Header Inline */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, flexWrap: "nowrap", width: "100%", overflow: "hidden" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
          <AccessTimeIcon sx={{ fontSize: 18, color: "secondary.main" }} />
          <Typography variant="subtitle2" fontWeight={800} color="secondary.main" sx={{ fontSize: "0.875rem", whiteSpace: "nowrap" }}>
            Thời điểm gốc T
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          (Chọn thời điểm bắt đầu)
        </Typography>
        <Box sx={{ flex: 1 }} />
        {selectedDate && selectedSlot && (
          <Chip
            size="small"
            label={`${dateToShort(selectedDate)} · ${slotToTime(selectedSlot)}`}
            color="secondary"
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
            <Typography variant="caption" color="secondary.main" fontWeight={700} sx={{ ml: "auto" }}>{draftDate}</Typography>
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
              "& .MuiSlider-mark": { height: 5 },
              color: "secondary.main",
            }}
          />
        </Box>

        {/* Slot slider Column */}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 0.5, width: "100%" }}>
            <AccessTimeIcon sx={{ fontSize: 12, color: "text.secondary", mr: 0.5 }} />
            <Typography variant="caption" color="text.secondary" fontWeight={700}>KHUNG GIỜ (15 phút)</Typography>
            <Typography variant="caption" color="secondary.main" fontWeight={700} sx={{ ml: "auto" }}>{slotToTime(draftSlot)}</Typography>
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
              color: "secondary.main",
              "& .MuiSlider-markLabel": { fontSize: "0.62rem", color: "text.secondary" },
              "& .MuiSlider-mark": { height: 5 },
            }}
          />
        </Box>
      </Stack>
    </Paper>
  );
}

// ─── ForecastEgoSidebar ────────────────────────────────────────────────────────
function ForecastEgoSidebar({
  selectedNode,
  forecastData,
  horizon,
  onReset,
  filters,
  onFilterChange,
  nodeLookup,
  isLoading,
}) {
  const [draftFilters, setDraftFilters] = useState(filters);
  useEffect(() => { setDraftFilters(filters); }, [filters]);

  function commitFilters(next) {
    setDraftFilters(next);
    if (next.maxDist === filters.maxDist && next.minCorr === filters.minCorr) return;
    onFilterChange(next);
  }

  const hColor = horizonColor(horizon);

  // Filter panel — luôn hiển thị
  const filterPanel = (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
        <FilterAltIcon sx={{ fontSize: 15, color: "text.secondary" }} />
        <Typography variant="caption" color="text.secondary" fontWeight={700}>BỘ LỌC</Typography>
      </Box>
      <Typography variant="caption" color="text.secondary">Phạm vi: <b>{draftFilters.maxDist} m</b></Typography>
      <Slider
        size="small" min={200} max={3000} step={100}
        value={draftFilters.maxDist}
        onChange={(_, v) => setDraftFilters((p) => ({ ...p, maxDist: v }))}
        onChangeCommitted={(_, v) => commitFilters({ ...draftFilters, maxDist: v })}
        valueLabelDisplay="auto"
        sx={{ mt: 0.5, mb: 1.5, color: hColor }}
      />
      <Typography variant="caption" color="text.secondary">|Corr| tối thiểu: <b>{draftFilters.minCorr.toFixed(1)}</b></Typography>
      <Slider
        size="small" min={0} max={1} step={0.1}
        value={draftFilters.minCorr}
        onChange={(_, v) => setDraftFilters((p) => ({ ...p, minCorr: v }))}
        onChangeCommitted={(_, v) => commitFilters({ ...draftFilters, minCorr: v })}
        valueLabelDisplay="auto"
        sx={{ mt: 0.5, color: hColor }}
      />
      <Box sx={{ mt: 1 }}>
        <Button size="small" variant="text" onClick={() => commitFilters({ maxDist: 1000, minCorr: 0.3 })}
          sx={{ minWidth: "auto", px: 1 }}>Reset</Button>
      </Box>
    </Box>
  );

  if (!selectedNode) {
    return (
      <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
        {filterPanel}
        <Divider />
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, py: 3, bgcolor: "rgba(103,58,183,0.02)", borderRadius: 2, border: "1px dashed", borderColor: "divider" }}>
          <TrendingUpIcon sx={{ fontSize: 36, color: "text.disabled" }} />
          <Typography variant="body2" color="text.secondary" fontWeight={600} textAlign="center">
            Chọn node để xem dự báo T+h
          </Typography>
          <Typography variant="caption" color="text.disabled" textAlign="center">
            Click vào một nút giao trên bản đồ
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (isLoading && !forecastData) {
    return (
      <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
        {filterPanel}
        <Divider />
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, py: 3 }}>
          <CircularProgress size={28} sx={{ color: hColor }} />
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            Đang dự báo T+{horizon} ({horizon * 15}p)...
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (!forecastData) return null;

  const { neighbors, horizonMinutes, predictedSlot, source } = forecastData;
  const top10 = neighbors.slice(0, 10);
  const avgAbsCorr = neighbors.length
    ? neighbors.reduce((s, n) => s + Math.abs(n.corr ?? 0), 0) / neighbors.length
    : 0;
  const strongest = top10[0] ?? null;
  const isHistorical = source === "historical_bundle" || horizon === 0;

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
      {/* Top linear progress during loading (colored matching horizon color) */}
      {isLoading && (
        <LinearProgress
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            bgcolor: `${hColor}20`,
            "& .MuiLinearProgress-bar": {
              bgcolor: hColor,
            },
          }}
        />
      )}

      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <TrendingUpIcon sx={{ color: hColor, fontSize: 20 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="subtitle2" fontWeight={800} noWrap>
              {getNodeDisplayName(selectedNode)}
            </Typography>
            {isLoading && (
              <CircularProgress size={16} sx={{ color: hColor }} />
            )}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
            OSM ID: {selectedNode?.osm_node_id}
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
          opacity: isLoading ? 0.55 : 1,
          pointerEvents: isLoading ? "none" : "auto",
          transition: "all 0.2s ease-in-out",
        }}
      >
        {/* Time badge */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Chip
            size="small"
            icon={<AccessTimeIcon sx={{ fontSize: "14px !important" }} />}
            label={`T: ${slotToTime(forecastData.baseSlot)}`}
            sx={{ bgcolor: "rgba(25,118,210,0.10)", color: "#1565c0", fontWeight: 700, fontSize: "0.7rem" }}
          />
          <Chip
            size="small"
            icon={isHistorical
              ? <AccessTimeIcon sx={{ fontSize: "14px !important" }} />
              : <TrendingUpIcon sx={{ fontSize: "14px !important" }} />}
            label={isHistorical
              ? "📊 Thực tế tại T"
              : `🔮 Dự báo ${slotToTime(predictedSlot)} (+${horizonMinutes}p)`}
            sx={{
              bgcolor: isHistorical ? "rgba(25,118,210,0.10)" : `${hColor}20`,
              color: isHistorical ? "#1565c0" : hColor,
              fontWeight: 700,
              fontSize: "0.7rem",
            }}
          />
        </Box>

        <Divider />
        {filterPanel}
        <Divider />

        {/* Stats */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Chip size="small" label={`${neighbors.length} neighbors`} sx={{ bgcolor: `${hColor}18`, color: hColor }} variant="filled" />
          <Chip size="small" label={`${neighbors.filter((n) => n.is_adjacent).length} adjacent`} variant="outlined" />
          <Chip size="small" label={`|corr| TB ${avgAbsCorr.toFixed(2)}`} variant="outlined" />
        </Box>

        {/* Strongest */}
        {strongest && (
          <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: `${hColor}10`, border: `1px solid ${hColor}30` }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>TƯƠNG QUAN MẠNH NHẤT</Typography>
            <Typography variant="body2" fontWeight={700} noWrap>
              {getNodeDisplayName(nodeLookup.get(strongest.osm_node_id) ?? strongest)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {strongest.dist_m}m · {strongest.corr >= 0 ? "+" : ""}{strongest.corr.toFixed(3)} · {corrLabel(strongest.corr)}
            </Typography>
          </Box>
        )}

        {/* Top 10 */}
        <Box sx={{ flex: 1, overflow: "auto" }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mb: 1, display: "block" }}>
            TOP 10 {isHistorical ? "TẠI T" : `DỰ BÁO +${horizonMinutes}P`}
          </Typography>
          {top10.length ? (
            <Stack spacing={0.75}>
              {top10.map((nb, i) => (
                <Box key={`${nb.osm_node_id}-${i}`}
                  sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, borderRadius: 2, bgcolor: "action.hover" }}>
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
            <Box sx={{ p: 2, borderRadius: 2, border: "1px dashed", borderColor: "divider" }}>
              <Typography variant="body2" fontWeight={700}>Không có kết quả phù hợp</Typography>
              <Typography variant="caption" color="text.secondary">Thử tăng phạm vi hoặc giảm |corr|.</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

// ─── Exports ──────────────────────────────────────────────────────────────────
export { HorizonSlider, ForecastTimePicker, ForecastEgoSidebar };
export { horizonLabel, horizonColor, slotToTime, dateToShort };
