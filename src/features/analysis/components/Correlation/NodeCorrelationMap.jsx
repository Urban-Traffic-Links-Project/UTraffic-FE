/**
 * NodeCorrelationMap.jsx
 *
 * Bản đồ Leaflet với 3 tính năng chính:
 *  1. Hiển thị nodes thật lên bản đồ
 *  2. Semantic Zooming — zoom thấp: dot nhỏ / zoom cao: dot lớn + label
 *  3. Ego-Network Focus — click node: dim toàn bộ, highlight node + neighbors + lines
 */
import L from "leaflet";
import { useCallback, useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";

// ─── Constants ────────────────────────────────────────────────────────────────
const HCMC = [10.78, 106.695];

// Semantic zoom breakpoints
const ZOOM_DOT = 15;   // >= 12: hiện thêm node trung bình
const ZOOM_ALL = 14;   // >= 14: hiện toàn bộ node
const ZOOM_LABEL = 15;   // >= 15: hiện label corr value

// Ego-Network filter defaults
const EGO_DIST_M = 1000;  // 1km
const EGO_MIN_CORR = 0.5;

// Colors
const COLOR_NODE_DEFAULT = "#7dd3fc";   // xanh nhạt — node bình thường
const COLOR_NODE_SELECTED = "#ff6f00";   // cam — node được click
const COLOR_NODE_NEIGHBOR = "#e91e63";   // hồng đỏ — neighbor trong ego-net
const COLOR_NODE_DIM = "#b0bec5";   // xám — bị dim
const COLOR_LINE = "#ff6f00";   // đường nối ego-network

// ─── Helpers ──────────────────────────────────────────────────────────────────
function corrToColor(corr) {
  // |corr| cao → đỏ, thấp → xanh
  const abs = Math.abs(corr);
  if (abs >= 0.8) return "#d32f2f";
  if (abs >= 0.6) return "#f57c00";
  if (abs >= 0.4) return "#fbc02d";
  return "#388e3c";
}

function toNumber(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function getLatLng(obj) {
  if (!obj) return null;
  const lat = toNumber(obj.lat);
  // Support common backend naming: lng vs lon
  const lng = toNumber(obj.lng ?? obj.lon);
  if (lat === null || lng === null) return null;
  return [lat, lng];
}

function getBoundsCenterOffset(map, point, offsetX = 0, offsetY = 0) {
  const projected = map.project(point, map.getZoom());
  const shifted = L.point(projected.x - offsetX, projected.y - offsetY);
  return map.unproject(shifted, map.getZoom());
}

function getNodeDegree(node) {
  return toNumber(node?.degree) ?? 0;
}

function getNodeBetweenness(node) {
  return toNumber(node?.betweenness_norm) ?? 0;
}

function getNodeImportance(node) {
  const degree = getNodeDegree(node);
  const betweenness = getNodeBetweenness(node);
  // Kết hợp số nhánh và centrality để node ở giữa trục đường không bị xếp quá thấp.
  return degree + betweenness * 6;
}

function shouldRenderNode(node, zoom) {
  const importance = getNodeImportance(node);
  if (zoom < ZOOM_DOT) return importance >= 3.2;
  if (zoom < ZOOM_ALL) return importance >= 2.2;
  return true;
}

function getFreeNodeRadius(node, zoom) {
  const importance = getNodeImportance(node);
  if (zoom < ZOOM_DOT) return importance >= 5 ? 5.8 : 3.6;
  if (zoom < ZOOM_ALL) return importance >= 4 ? 5.8 : 4.8;
  return importance >= 5 ? 7 : importance >= 3.2 ? 5.8 : 5.4;
}

function getFreeNodeStyle(node) {
  const importance = getNodeImportance(node);
  if (importance >= 5) return { color: "#ef4444", opacity: 0.98, weight: 2.4 };
  if (importance >= 4.0) return { color: "#f59e0b", opacity: 0.94, weight: 2.1 };
  if (importance >= 3.0) return { color: "#10b981", opacity: 0.9, weight: 1.9 };
  return { color: COLOR_NODE_DEFAULT, opacity: 0.82, weight: 1.6 };
}

function makeCircle(latlng, radius, color, opacity, weight = 2, zIndex = 400) {
  return L.circleMarker(latlng, {
    radius,
    color,
    fillColor: color,
    fillOpacity: opacity,
    opacity,
    weight,
    bubblingMouseEvents: false,
    pane: "markerPane",
  });
}

function makeTooltip(content) {
  return L.tooltip({
    permanent: true,
    direction: "top",
    offset: [0, -8],
    className: "corr-tooltip",
  }).setContent(content);
}

// ─── Inner map controller (cần useMap hook nên phải là component con) ─────────
function MapController({
  nodes,
  edges,
  egoData,
  focusMode,
  onNodeClick,
  onMapClick,
  viewportKey,
  viewportOffsetX = 0,
  sidebarOpen = false,
}) {
  const map = useMap();
  const layersRef = useRef({ nodes: [], lines: [], labels: [] });

  // Click nền bản đồ → thoát focus
  useMapEvents({
    click: (e) => {
      if (!e.originalEvent._nodeClick) onMapClick();
    },
    zoomend: () => drawNodes(),
  });

  const clearAll = useCallback(() => {
    const { nodes: nl, lines: ll, labels: lbl } = layersRef.current;
    [...nl, ...ll, ...lbl].forEach((l) => map.removeLayer(l));
    layersRef.current = { nodes: [], lines: [], labels: [] };
  }, [map]);

  useEffect(() => {
    map.invalidateSize({ animate: false });
  }, [map, sidebarOpen]);

  // ── Vẽ nodes theo mode ────────────────────────────────────────────────────
  const drawNodes = useCallback(() => {
    clearAll();
    const zoom = map.getZoom();
    const newLayers = { nodes: [], lines: [], labels: [] };

    if (!nodes?.length) return;

    // ---------- EGO-NETWORK MODE ----------
    if (focusMode && egoData) {
      const { selected, neighbors } = egoData;
      const neighborMap = new Map(neighbors.map((n) => [n.id, n]));

      nodes.forEach((node) => {
        const isSelected = node.osm_node_id === selected.osm_node_id;
        const neighbor = neighborMap.get(node.id);
        const isNeighbor = Boolean(neighbor);

        const latlng = getLatLng(node);
        if (!latlng) return;
        let color, opacity, radius;

        if (isSelected) {
          color = COLOR_NODE_SELECTED; opacity = 1; radius = 7.5;
        } else if (isNeighbor) {
          color = corrToColor(neighbor.corr); opacity = 1; radius = 5.5;
        } else {
          color = COLOR_NODE_DIM; opacity = 0.12; radius = 3;
        }

        const circle = makeCircle(latlng, radius, color, opacity);

        // Click handler
        circle.on("click", (e) => {
          e.originalEvent._nodeClick = true;
          onNodeClick(node);
        });

        // Tooltip corr value (zoom >= ZOOM_LABEL hoặc là selected/neighbor)
        if ((isSelected || isNeighbor) && zoom >= ZOOM_DOT) {
          const label = isSelected
            ? "★"
            : `${neighbor.corr >= 0 ? "+" : ""}${neighbor.corr.toFixed(2)}`;
          const tt = makeTooltip(label);
          circle.bindTooltip(tt);
          if (zoom >= ZOOM_LABEL || isSelected || isNeighbor) {
            circle.addTo(map);
            circle.openTooltip();
          }
        } else {
          circle.addTo(map);
        }

        newLayers.nodes.push(circle);
      });

      // Vẽ đường nối selected → neighbors
      const selectedLatLng = getLatLng(selected);
      neighbors.forEach((nb) => {
        const nbLatLng = getLatLng(nb);
        if (!selectedLatLng || !nbLatLng) return;
        const line = L.polyline(
          [selectedLatLng, nbLatLng],
          {
            color: corrToColor(nb.corr),
            weight: nb.is_adjacent ? 3 : 1.5,
            opacity: 0.85,
            dashArray: nb.is_adjacent ? null : "6,4",
          }
        ).addTo(map);
        newLayers.lines.push(line);
      });

      // ---------- FREE MODE (xem tất cả nodes) ----------
    } else {

      nodes.forEach((node) => {
        const latlng = getLatLng(node);
        if (!latlng || !shouldRenderNode(node, zoom)) return;
        const radius = getFreeNodeRadius(node, zoom);
        const { color, opacity, weight } = getFreeNodeStyle(node);
        const circle = makeCircle(latlng, radius, color, opacity, weight);

        circle.on("click", (e) => {
          e.originalEvent._nodeClick = true;
          onNodeClick(node);
        });

        // Popup khi hover (zoom cao mới hiện)
        if (zoom >= ZOOM_LABEL) {
          circle.bindTooltip(
            `<b>OSM: ${node.osm_node_id}</b><br/>idx: ${node.node_index}<br/>degree: ${getNodeDegree(node)}`,
            { direction: "top", offset: [0, -8] }
          );
        }

        circle.addTo(map);
        newLayers.nodes.push(circle);
      });
    }

    layersRef.current = newLayers;
  }, [map, nodes, edges, egoData, focusMode, clearAll, onNodeClick]);

  // Re-draw khi data hoặc mode thay đổi
  useEffect(() => {
    drawNodes();
  }, [drawNodes]);

  useEffect(() => {
    map.invalidateSize({ animate: false });

    if (!focusMode || !egoData) return;

    const allPoints = [egoData.selected, ...(egoData.neighbors ?? [])]
      .map(getLatLng)
      .filter(Boolean);

    if (allPoints.length > 1) {
      const bounds = L.latLngBounds(allPoints);
      map.stop();
      map.flyToBounds(bounds, {
        paddingTopLeft: [60, 60],
        paddingBottomRight: [60, 60],
        maxZoom: 16,
        duration: 0.45,
      });
      return;
    }

    if (allPoints.length === 1) {
      const centeredPoint = viewportOffsetX
        ? getBoundsCenterOffset(map, allPoints[0], viewportOffsetX / 2, 0)
        : allPoints[0];
      map.stop();
      map.flyTo(centeredPoint, 16, { duration: 0.45 });
    }
  }, [map, egoData, focusMode, viewportKey, viewportOffsetX]);

  return null;
}

// ─── Main component ───────────────────────────────────────────────────────────
export function NodeCorrelationMap({
  nodes = [],
  edges = [],
  egoData = null,
  focusMode = false,
  onNodeClick,
  onMapClick,
  height = 520,
  viewportKey,
  viewportOffsetX = 0,
  sidebarOpen = false,
}) {
  return (
    <>
      {/* CSS cho tooltip */}
      <style>{`
        .corr-tooltip {
          background: rgba(15, 23, 42, 0.88);
          border: none;
          border-radius: 6px;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 7px;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .corr-tooltip::before { display: none; }
      `}</style>

      <MapContainer
        center={HCMC}
        zoom={16}
        scrollWheelZoom
        style={{ width: "100%", height, borderRadius: 12 }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <MapController
          nodes={nodes}
          edges={edges}
          egoData={egoData}
          focusMode={focusMode}
          onNodeClick={onNodeClick}
          onMapClick={onMapClick}
          viewportKey={viewportKey}
          viewportOffsetX={viewportOffsetX}
          sidebarOpen={sidebarOpen}
        />
      </MapContainer>
    </>
  );
}