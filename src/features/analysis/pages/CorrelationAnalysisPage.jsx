/**
 * CorrelationAnalysisPage.jsx — Trang phân tích tương quan
 *
 * Flow:
 *  1. Load trang → fetch 305 nodes + 429 edges → vẽ lên bản đồ (free mode)
 *  2. Click node → fetch ego-network (1km, corr>=0.5) → vào focus mode
 *  3. Click nền bản đồ → thoát focus mode
 */
import {
  Box, Chip, CircularProgress, Divider,
  Paper, Slider, Stack, Typography, IconButton, Tooltip, Slide, Button,
} from "@mui/material";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
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

  if (Number.isFinite(node?.node_index)) {
    return `Nút giao #${node.node_index + 1}`;
  }

  if (node?.osm_node_id) {
    return `Nút giao OSM ${node.osm_node_id}`;
  }

  return "Nút giao";
}

const FILTER_PRESETS = [
  { label: "Gần", maxDist: 500, minCorr: 0.3 },
  { label: "Cân bằng", maxDist: 1000, minCorr: 0.5 },
  { label: "Rộng", maxDist: 1500, minCorr: 0.3 },
  { label: "Mạnh", maxDist: 1200, minCorr: 0.7 },
];

// ─── Sidebar khi ở focus mode ─────────────────────────────────────────────────
function EgoSidebar({ selectedNode, egoData, onReset, filters, onFilterChange, nodeLookup }) {
  if (!selectedNode || !egoData) return null;
  const { neighbors } = egoData;
  const top10 = [...neighbors].slice(0, 10);
  const selectedDisplayName = getNodeDisplayName(selectedNode);
  const [draftFilters, setDraftFilters] = useState(filters);

  useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);

  const strongestNeighbor = top10[0] ?? null;
  const avgAbsCorr = neighbors.length
    ? neighbors.reduce((sum, n) => sum + Math.abs(n.corr ?? 0), 0) / neighbors.length
    : 0;

  function commitFilters(nextFilters) {
    setDraftFilters(nextFilters);
    if (
      nextFilters.maxDist === filters.maxDist &&
      nextFilters.minCorr === filters.minCorr
    ) {
      return;
    }
    onFilterChange(nextFilters);
  }

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
        gap: 2,
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <MyLocationIcon sx={{ color: "#ff6f00", fontSize: 20 }} />
        <Box sx={{ flex: 1 }}>
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

      <Divider />

      {/* Filter controls */}
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
          size="small"
          min={200} max={3000} step={100}
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
          size="small"
          min={0} max={1} step={0.1}
          value={draftFilters.minCorr}
          onChange={(_, v) => setDraftFilters((prev) => ({ ...prev, minCorr: v }))}
          onChangeCommitted={(_, v) => commitFilters({ ...draftFilters, minCorr: v })}
          valueLabelDisplay="auto"
          sx={{ mt: 0.5 }}
        />
        <Stack direction="row" spacing={0.75} sx={{ mt: 1.25, flexWrap: "wrap", rowGap: 0.75 }}>
          {FILTER_PRESETS.map((preset) => {
            const active =
              draftFilters.maxDist === preset.maxDist &&
              draftFilters.minCorr === preset.minCorr;
            return (
              <Chip
                key={preset.label}
                size="small"
                label={preset.label}
                color={active ? "primary" : "default"}
                variant={active ? "filled" : "outlined"}
                onClick={() => commitFilters({ maxDist: preset.maxDist, minCorr: preset.minCorr })}
              />
            );
          })}
          <Button
            size="small"
            variant="text"
            onClick={() => commitFilters({ maxDist: 1000, minCorr: 0.5 })}
            sx={{ minWidth: "auto", px: 1 }}
          >
            Reset
          </Button>
        </Stack>
      </Box>

      <Divider />

      {/* Stats */}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Chip
          size="small"
          label={`${neighbors.length} neighbors`}
          color="primary"
          variant="outlined"
        />
        <Chip
          size="small"
          label={`${neighbors.filter((n) => n.is_adjacent).length} adjacent`}
          variant="outlined"
        />
        <Chip
          size="small"
          label={`|corr| TB ${avgAbsCorr.toFixed(2)}`}
          variant="outlined"
        />
      </Box>

      {strongestNeighbor && (
        <Box
          sx={{
            p: 1.25,
            borderRadius: 2,
            bgcolor: "rgba(255, 111, 0, 0.08)",
            border: "1px solid rgba(255, 111, 0, 0.18)",
          }}
        >
          <Typography variant="caption" color="text.secondary" fontWeight={700}>
            TƯƠNG QUAN MẠNH NHẤT
          </Typography>
          <Typography variant="body2" fontWeight={700} noWrap>
            {getNodeDisplayName(nodeLookup.get(strongestNeighbor.osm_node_id) ?? strongestNeighbor)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {strongestNeighbor.dist_m}m • {strongestNeighbor.corr >= 0 ? "+" : ""}
            {strongestNeighbor.corr.toFixed(3)} • {corrLabel(strongestNeighbor.corr)}
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
              <Box
                key={nb.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  p: 1,
                  borderRadius: 2,
                  bgcolor: "action.hover",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    width: 20,
                    textAlign: "center",
                    fontWeight: 800,
                    color: "text.secondary",
                  }}
                >
                  {i + 1}
                </Typography>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="caption" noWrap sx={{ fontWeight: 600, display: "block" }}>
                    {getNodeDisplayName(nodeLookup.get(nb.osm_node_id) ?? nb)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    OSM {nb.osm_node_id} • {nb.dist_m}m • {nb.is_adjacent ? "adjacent" : "non-adj"}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 900,
                      fontSize: "0.75rem",
                      color: corrColor(nb.corr),
                      display: "block",
                    }}
                  >
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
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              border: "1px dashed",
              borderColor: "divider",
              bgcolor: "background.default",
            }}
          >
            <Typography variant="body2" fontWeight={700}>
              Không có node phù hợp bộ lọc hiện tại
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Hãy tăng phạm vi hoặc giảm ngưỡng |corr| để xem thêm mối tương quan.
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
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        px: 2,
        py: 1.5,
        display: "flex",
        gap: 2.5,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <Typography variant="caption" fontWeight={700} color="text.secondary">
        LEGEND
      </Typography>
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#7dd3fc" }} />
            <Typography variant="caption">Mức thấp</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#f59e0b" }} />
            <Typography variant="caption">Mức trung bình</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#2563eb" }} />
            <Typography variant="caption">Mức cao</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#7c3aed" }} />
            <Typography variant="caption">Node trục chính</Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Click để xem tương quan
          </Typography>
        </>
      )}
    </Paper>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function CorrelationAnalysisPage() {
  // State
  const [selectedNode, setSelectedNode] = useState(null);
  const [focusMode, setFocusMode] = useState(false);
  const [egoData, setEgoData] = useState(null);
  const [egoLoading, setEgoLoading] = useState(false);
  const [filters, setFilters] = useState({ maxDist: 1000, minCorr: 0.5 });

  // ── Fetch tất cả nodes + edges khi load trang ─────────────────────────────
  const nodesQuery = useQuery({
    queryKey: ["corr-nodes"],
    queryFn: () => correlationApi.fetchNodes(),
    staleTime: Infinity,  // nodes không thay đổi → cache mãi
  });

  const edgesQuery = useQuery({
    queryKey: ["corr-edges"],
    queryFn: () => correlationApi.fetchEdges(),
    staleTime: Infinity,
  });

  // ── Click node → fetch ego-network ───────────────────────────────────────
  const handleNodeClick = useCallback(async (node) => {
    setSelectedNode(node);
    setEgoLoading(true);
    setEgoData(null);

    try {
      const data = await correlationApi.fetchCorrelation(node.osm_node_id, {
        max_dist_m: filters.maxDist,
        min_corr: filters.minCorr,
      });
      setEgoData(data);
      setFocusMode(true);
    } catch (err) {
      console.error("fetchCorrelation error:", err);
    } finally {
      setEgoLoading(false);
    }
  }, [filters]);

  // ── Click nền bản đồ → thoát focus ───────────────────────────────────────
  const handleMapClick = useCallback(() => {
    setFocusMode(false);
    setSelectedNode(null);
    setEgoData(null);
  }, []);

  // ── Filter thay đổi → re-fetch ego nếu đang focus ────────────────────────
  const handleFilterChange = useCallback(async (newFilters) => {
    setFilters(newFilters);
    if (!selectedNode) return;

    setEgoLoading(true);
    try {
      const data = await correlationApi.fetchCorrelation(selectedNode.osm_node_id, {
        max_dist_m: newFilters.maxDist,
        min_corr: newFilters.minCorr,
      });
      setEgoData(data);
    } finally {
      setEgoLoading(false);
    }
  }, [selectedNode]);

  const isLoading = nodesQuery.isLoading || edgesQuery.isLoading;
  const showSidebar = focusMode && Boolean(egoData);
  const nodeLookup = useMemo(
    () => new Map((nodesQuery.data ?? []).map((node) => [node.osm_node_id, node])),
    [nodesQuery.data]
  );
  const viewportKey = useMemo(() => {
    if (!focusMode || !egoData?.selected) return "free";
    const selectedId = egoData.selected.osm_node_id ?? egoData.selected.id ?? "selected";
    return `${selectedId}:${filters.maxDist}:${filters.minCorr}:${egoData.neighbors?.length ?? 0}`;
  }, [focusMode, egoData, filters.maxDist, filters.minCorr]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5" fontWeight={900} gutterBottom>
          Phân tích tương quan giao thông
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {focusMode
            ? "Đang xem Ego-Network. Click vào nền bản đồ để thoát."
            : `${nodesQuery.data?.length ?? "..."} nodes · Click vào 1 node để xem tương quan`}
        </Typography>
      </Box>

      {/* ── Main layout ────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: showSidebar ? "minmax(0, 1fr) 320px" : "minmax(0, 1fr)",
          },
          gap: 2.5,
          transition: "grid-template-columns 0.3s ease",
          alignItems: "start",
        }}
      >
        {/* Left: bản đồ */}
        <Box>
          <Paper
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Loading overlay */}
            {(isLoading || egoLoading) && (
              <Box
                sx={{
                  position: "absolute", inset: 0, zIndex: 1000,
                  bgcolor: "rgba(255,255,255,0.75)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 1.5,
                }}
              >
                <CircularProgress size={28} />
                <Typography variant="body2" fontWeight={600}>
                  {isLoading ? "Đang tải dữ liệu..." : "Đang tính tương quan..."}
                </Typography>
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

          {/* Legend */}
          <Box sx={{ mt: 1.5 }}>
            <MapLegend focusMode={focusMode} />
          </Box>
        </Box>

        {/* Right: sidebar (chỉ hiện khi focus mode) */}
        <Slide
          direction="left"
          in={showSidebar}
          mountOnEnter
          unmountOnExit
          timeout={{ enter: 300, exit: 300 }}
        >
          <Box
            sx={{
              minWidth: 0,
              transformOrigin: "right center",
            }}
          >
            <EgoSidebar
              selectedNode={selectedNode}
              egoData={egoData}
              onReset={handleMapClick}
              filters={filters}
              onFilterChange={handleFilterChange}
              nodeLookup={nodeLookup}
            />
          </Box>
        </Slide>
      </Box>
    </Box>
  );
}