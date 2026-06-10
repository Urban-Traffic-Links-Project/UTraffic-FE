/**
 * src/features/routeMonitor/components/RouteMap.jsx
 * Bản đồ Leaflet hiển thị tuyến đường A→B với màu theo trạng thái kẹt xe.
 */

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import styles from "./RouteMap.module.css";

const TOMTOM_API_KEY = import.meta.env.VITE_TOMTOM_API_KEY;

// Tọa độ tuyến đường cố định
const POINT_A = [10.794694, 106.792639];
const POINT_B = [10.788056, 106.803500];

// Map center giữa 2 điểm
const ROUTE_CENTER = [
  (POINT_A[0] + POINT_B[0]) / 2,
  (POINT_A[1] + POINT_B[1]) / 2,
];

const STATUS_COLORS = {
  stable: "#22c55e",       // xanh lá
  moderate: "#f59e0b",     // vàng cam
  congested: "#ef4444",    // đỏ
  road_closed: "#7c3aed",  // tím
  unknown: "#6b7280",      // xám
};

function getStatusColor(status) {
  return STATUS_COLORS[status] || STATUS_COLORS.unknown;
}

function getStatusLabel(status) {
  const labels = {
    stable: "Thông thoáng",
    moderate: "Chậm",
    congested: "Kẹt xe",
    road_closed: "Đóng đường",
    unknown: "Không rõ",
  };
  return labels[status] || "Không rõ";
}

/** Tự zoom về tuyến đường khi mount */
function FitBoundsToRoute({ isHistoryMode }) {
  const map = useMap();

  useEffect(() => {
    const bounds = [POINT_A, POINT_B];
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map]);

  return null;
}

/**
 * @param {Object} props
 * @param {string} props.statusA - status của điểm A
 * @param {string} props.statusB - status của điểm B
 * @param {string} props.overallStatus - status tổng hợp
 * @param {boolean} props.isHistoryMode - đang xem lịch sử?
 * @param {Object} props.dataA - dữ liệu snapshot điểm A
 * @param {Object} props.dataB - dữ liệu snapshot điểm B
 */
export function RouteMap({
  statusA = "unknown",
  statusB = "unknown",
  overallStatus = "unknown",
  isHistoryMode = false,
  dataA = null,
  dataB = null,
}) {
  const lineColor = getStatusColor(overallStatus);
  const lineOpacity = isHistoryMode ? 0.55 : 0.9;

  return (
    <div className={styles.mapWrapper}>
      <MapContainer
        center={ROUTE_CENTER}
        zoom={14}
        scrollWheelZoom={true}
        className={styles.leafletMap}
      >
        {/* OpenStreetMap base tile */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* TomTom realtime traffic overlay (chỉ hiện khi có key) */}
        {TOMTOM_API_KEY && !isHistoryMode && (
          <TileLayer
            attribution="Traffic &copy; TomTom"
            url={`https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${TOMTOM_API_KEY}`}
            opacity={0.7}
            zIndex={400}
          />
        )}

        {/* Polyline tuyến đường A→B */}
        <Polyline
          positions={[POINT_A, POINT_B]}
          pathOptions={{
            color: lineColor,
            weight: 8,
            opacity: lineOpacity,
            lineCap: "round",
            lineJoin: "round",
            dashArray: isHistoryMode ? "12, 6" : undefined,
          }}
        />

        {/* Marker điểm A */}
        <CircleMarker
          center={POINT_A}
          radius={12}
          pathOptions={{
            color: "#fff",
            fillColor: getStatusColor(statusA),
            fillOpacity: 0.95,
            weight: 3,
          }}
        >
          <Popup>
            <div className={styles.popupContent}>
              <strong>📍 Điểm A — Đầu tuyến</strong>
              <br />
              <span>10°47&apos;40.9&quot;N, 106°47&apos;33.5&quot;E</span>
              <br />
              <span className={styles.popupStatus} style={{ color: getStatusColor(statusA) }}>
                ● {getStatusLabel(statusA)}
              </span>
              {dataA?.current_speed != null && (
                <>
                  <br />
                  <span>{dataA.current_speed.toFixed(1)} km/h</span>
                </>
              )}
              {dataA?.congestion_percent != null && (
                <>
                  <br />
                  <span>Kẹt xe: {dataA.congestion_percent.toFixed(0)}%</span>
                </>
              )}
            </div>
          </Popup>
        </CircleMarker>

        {/* Marker điểm B */}
        <CircleMarker
          center={POINT_B}
          radius={12}
          pathOptions={{
            color: "#fff",
            fillColor: getStatusColor(statusB),
            fillOpacity: 0.95,
            weight: 3,
          }}
        >
          <Popup>
            <div className={styles.popupContent}>
              <strong>🏁 Điểm B — Cuối tuyến</strong>
              <br />
              <span>10°47&apos;17.0&quot;N, 106°48&apos;12.6&quot;E</span>
              <br />
              <span className={styles.popupStatus} style={{ color: getStatusColor(statusB) }}>
                ● {getStatusLabel(statusB)}
              </span>
              {dataB?.current_speed != null && (
                <>
                  <br />
                  <span>{dataB.current_speed.toFixed(1)} km/h</span>
                </>
              )}
              {dataB?.congestion_percent != null && (
                <>
                  <br />
                  <span>Kẹt xe: {dataB.congestion_percent.toFixed(0)}%</span>
                </>
              )}
            </div>
          </Popup>
        </CircleMarker>

        <FitBoundsToRoute />
      </MapContainer>

      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "#22c55e" }} />
          <span>Thông thoáng</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "#f59e0b" }} />
          <span>Chậm</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "#ef4444" }} />
          <span>Kẹt xe</span>
        </div>
        {isHistoryMode && (
          <div className={`${styles.legendItem} ${styles.historyNote}`}>
            <span>⏰ Dữ liệu lịch sử</span>
          </div>
        )}
      </div>
    </div>
  );
}
