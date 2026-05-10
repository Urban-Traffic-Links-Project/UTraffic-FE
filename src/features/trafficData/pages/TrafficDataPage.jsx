import { useCallback, useMemo, useState } from "react";
import styles from "./TrafficDataPage.module.css";

import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import TrafficOutlinedIcon from "@mui/icons-material/TrafficOutlined";
import HCMCMap from "../components/HCMMap";

const TOMTOM_API_KEY = import.meta.env.VITE_TOMTOM_API_KEY;
const TOMTOM_FLOW_SEGMENT_STYLE = "relative0";
const DEFAULT_TOMTOM_FLOW_ZOOM = 14;
const UNKNOWN_ROAD_NAME = "Đoạn đường gần vị trí click";

function formatNumber(value, digits = 1) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) return "--";

  return numberValue.toFixed(digits);
}

function formatSeconds(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) return "--";

  if (numberValue < 60) return `${Math.round(numberValue)}s`;

  const minutes = Math.floor(numberValue / 60);
  const seconds = Math.round(numberValue % 60);

  return `${minutes}m ${seconds}s`;
}

function clampTomTomZoom(value) {
  const zoom = Math.round(Number(value));

  if (!Number.isFinite(zoom)) return DEFAULT_TOMTOM_FLOW_ZOOM;

  return Math.max(0, Math.min(22, zoom));
}

function getTrafficStatus(flow) {
  if (!flow) return "Unknown";
  if (flow.roadClosure) return "Road closed";

  const currentSpeed = Number(flow.currentSpeed);
  const freeFlowSpeed = Number(flow.freeFlowSpeed);
  const currentTravelTime = Number(flow.currentTravelTime);
  const freeFlowTravelTime = Number(flow.freeFlowTravelTime);

  const speedRatio = freeFlowSpeed > 0 ? currentSpeed / freeFlowSpeed : 1;
  const travelTimeRatio = freeFlowTravelTime > 0 ? currentTravelTime / freeFlowTravelTime : 1;

  if (speedRatio <= 0.45 || travelTimeRatio >= 1.7) return "Congested";
  if (speedRatio <= 0.75 || travelTimeRatio >= 1.25) return "Moderate";

  return "Stable";
}

function getDelaySeconds(flow) {
  const currentTravelTime = Number(flow?.currentTravelTime);
  const freeFlowTravelTime = Number(flow?.freeFlowTravelTime);

  if (!Number.isFinite(currentTravelTime) || !Number.isFinite(freeFlowTravelTime)) {
    return null;
  }

  return Math.max(0, currentTravelTime - freeFlowTravelTime);
}

function getCongestionPercent(flow) {
  const currentSpeed = Number(flow?.currentSpeed);
  const freeFlowSpeed = Number(flow?.freeFlowSpeed);

  if (!Number.isFinite(currentSpeed) || !Number.isFinite(freeFlowSpeed) || freeFlowSpeed <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((1 - currentSpeed / freeFlowSpeed) * 100)));
}

function getStatusClassName(status) {
  if (status === "Road closed" || status === "Congested") return styles.statusDanger;
  if (status === "Moderate") return styles.statusWarning;
  if (status === "Stable") return styles.statusSuccess;
  return styles.statusNeutral;
}

function normalizeTomTomCoordinates(flow) {
  const coordinates = flow?.coordinates?.coordinate || [];

  if (!Array.isArray(coordinates)) return [];

  return coordinates.filter((point) => {
    const latitude = Number(point?.latitude ?? point?.lat);
    const longitude = Number(point?.longitude ?? point?.lng ?? point?.lon);
    return Number.isFinite(latitude) && Number.isFinite(longitude);
  });
}

function normalizeTomTomFlow(data, queryZoom) {
  const flow = data?.flowSegmentData || {};
  const status = getTrafficStatus(flow);
  const delaySeconds = getDelaySeconds(flow);

  return {
    frc: flow.frc || "--",
    currentSpeed: Number(flow.currentSpeed),
    freeFlowSpeed: Number(flow.freeFlowSpeed),
    currentTravelTime: Number(flow.currentTravelTime),
    freeFlowTravelTime: Number(flow.freeFlowTravelTime),
    confidence: Number(flow.confidence),
    roadClosure: Boolean(flow.roadClosure),
    coordinates: normalizeTomTomCoordinates(flow),
    status,
    delaySeconds,
    congestionPercent: getCongestionPercent(flow),
    queryZoom,
  };
}

function getRoadNameFromReverseGeocode(data) {
  const address = data?.addresses?.[0]?.address || {};

  return (
    address.streetName ||
    address.street ||
    address.routeNumbers?.[0] ||
    address.streetNameAndNumber ||
    address.freeformAddress ||
    UNKNOWN_ROAD_NAME
  );
}

async function fetchTomTomFlowSegment({ latitude, longitude, zoom }) {
  const queryZoom = clampTomTomZoom(zoom);
  const params = new URLSearchParams({
    key: TOMTOM_API_KEY,
    point: `${latitude},${longitude}`,
    unit: "KMPH",
    openLr: "false",
  });

  const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/${TOMTOM_FLOW_SEGMENT_STYLE}/${queryZoom}/json?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    let message = `TomTom Flow Segment request failed (${response.status})`;

    try {
      const errorBody = await response.json();
      message = errorBody?.detailedError?.message || errorBody?.error || message;
    } catch {
      // Keep fallback message.
    }

    throw new Error(message);
  }

  const data = await response.json();
  return normalizeTomTomFlow(data, queryZoom);
}

async function fetchTomTomRoadName({ latitude, longitude }) {
  const params = new URLSearchParams({
    key: TOMTOM_API_KEY,
    language: "vi-VN",
    returnRoadUse: "true",
    returnMatchType: "true",
    radius: "80",
  });

  const url = `https://api.tomtom.com/search/2/reverseGeocode/${latitude},${longitude}.json?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    return UNKNOWN_ROAD_NAME;
  }

  const data = await response.json();
  return getRoadNameFromReverseGeocode(data);
}

function InfoMetric({ icon, label, value, helper }) {
  return (
    <div className={styles.metricCard}>
      <div className={styles.metricIcon}>{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {helper && <small>{helper}</small>}
      </div>
    </div>
  );
}

export function TrafficDataPage() {
  const [selectedRoad, setSelectedRoad] = useState(null);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [isLoadingFlow, setIsLoadingFlow] = useState(false);
  const [flowError, setFlowError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const handleRoadSelected = useCallback(async (road) => {
    const pendingRoad = {
      ...road,
      name: "Đang xác định tên đường...",
      nameSource: "TomTom Reverse Geocoding",
    };

    setSelectedRoad(pendingRoad);
    setSelectedFlow(null);
    setFlowError("");

    if (!TOMTOM_API_KEY) {
      setSelectedRoad({
        ...road,
        name: UNKNOWN_ROAD_NAME,
        nameSource: "Fallback",
      });
      setFlowError("Chưa cấu hình VITE_TOMTOM_API_KEY trong file .env.");
      return;
    }

    try {
      setIsLoadingFlow(true);

      const [flow, roadName] = await Promise.all([
        fetchTomTomFlowSegment(road),
        fetchTomTomRoadName(road),
      ]);

      setSelectedRoad({
        ...road,
        name: roadName || UNKNOWN_ROAD_NAME,
        nameSource: roadName && roadName !== UNKNOWN_ROAD_NAME ? "TomTom Reverse Geocoding" : "Fallback",
      });
      setSelectedFlow(flow);
      setLastUpdatedAt(new Date());
    } catch (error) {
      const roadName = await fetchTomTomRoadName(road).catch(() => UNKNOWN_ROAD_NAME);

      setSelectedRoad({
        ...road,
        name: roadName || UNKNOWN_ROAD_NAME,
        nameSource: roadName && roadName !== UNKNOWN_ROAD_NAME ? "TomTom Reverse Geocoding" : "Fallback",
      });
      setFlowError(error?.message || "Không lấy được dữ liệu TomTom cho vị trí đã chọn.");
    } finally {
      setIsLoadingFlow(false);
    }
  }, []);

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdatedAt) return "--";

    return lastUpdatedAt.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, [lastUpdatedAt]);

  const speedRatioLabel = useMemo(() => {
    if (!selectedFlow) return "--";

    const currentSpeed = Number(selectedFlow.currentSpeed);
    const freeFlowSpeed = Number(selectedFlow.freeFlowSpeed);

    if (!Number.isFinite(currentSpeed) || !Number.isFinite(freeFlowSpeed) || freeFlowSpeed <= 0) {
      return "--";
    }

    return `${Math.round((currentSpeed / freeFlowSpeed) * 100)}% free-flow`;
  }, [selectedFlow]);

  return (
    <div className={styles.page}>
      <div className={styles.mapPanel}>
        <HCMCMap
          selectedSegmentId={selectedRoad?.id}
          selectedSegmentCoordinates={selectedFlow?.coordinates || []}
          onSegmentSelect={handleRoadSelected}
        />

        <div className={styles.mapLegend}>
          <span className={styles.legendTitle}>TomTom realtime flow</span>
          <span><i className={styles.legendGreen} /> Stable</span>
          <span><i className={styles.legendYellow} /> Slow</span>
          <span><i className={styles.legendRed} /> Congested / closed</span>
          <span><i className={styles.legendBlue} /> Selected segment</span>
        </div>
      </div>

      <aside
        className={styles.infoPanel}
        onWheel={(event) => event.stopPropagation()}
        onTouchMove={(event) => event.stopPropagation()}
      >
        <div className={styles.panelHeader}>
          <span className={styles.kicker}>Selected segment</span>
          <h2>{selectedRoad?.name || "Chưa chọn đoạn đường"}</h2>
          <p>Click trực tiếp vào một đoạn đường trên bản đồ để chọn.</p>
        </div>

        <div className={styles.infoContent}>
          {selectedRoad && (
            <div className={styles.selectedRoadBox}>
              <div>
                <span>Tên đường</span>
                <strong>{selectedRoad.name || UNKNOWN_ROAD_NAME}</strong>
              </div>
              <div>
                <span>Tọa độ</span>
                <strong>
                  {formatNumber(selectedRoad.latitude, 5)}, {formatNumber(selectedRoad.longitude, 5)}
                </strong>
              </div>
            </div>
          )}

          {isLoadingFlow && <div className={styles.loadingBox}>Đang lấy dữ liệu TomTom...</div>}
          {flowError && <div className={styles.errorBox}>{flowError}</div>}

          {!selectedRoad && !flowError && (
            <div className={styles.emptyState}>
              <TrafficOutlinedIcon />
              <strong>Chưa có đoạn đường nào được chọn</strong>
              <span>Hãy click trực tiếp vào đường đang được tô màu trên bản đồ.</span>
            </div>
          )}

          {selectedRoad && selectedFlow && (
            <>
              <div className={styles.statusRow}>
                <span className={`${styles.statusBadge} ${getStatusClassName(selectedFlow.status)}`}>
                  {selectedFlow.status}
                </span>
                <span className={styles.lastUpdated}>Updated: {lastUpdatedLabel}</span>
              </div>

              <div className={styles.metricsGrid}>
                <InfoMetric
                  icon={<SpeedOutlinedIcon />}
                  label="Current speed"
                  value={`${formatNumber(selectedFlow.currentSpeed)} km/h`}
                  helper={speedRatioLabel}
                />
                <InfoMetric
                  icon={<TrafficOutlinedIcon />}
                  label="Free-flow speed"
                  value={`${formatNumber(selectedFlow.freeFlowSpeed)} km/h`}
                  helper={`FRC: ${selectedFlow.frc}`}
                />
                <InfoMetric
                  icon={<AccessTimeOutlinedIcon />}
                  label="Delay"
                  value={formatSeconds(selectedFlow.delaySeconds)}
                  helper={`Current: ${formatSeconds(selectedFlow.currentTravelTime)}`}
                />
                <InfoMetric
                  icon={<InsightsOutlinedIcon />}
                  label="Confidence"
                  value={formatNumber(selectedFlow.confidence, 2)}
                  helper="TomTom quality score"
                />
              </div>

              <div className={styles.detailCard}>
                <div className={styles.detailHeader}>
                  <h3>Congestion level</h3>
                  <strong>{selectedFlow.congestionPercent}%</strong>
                </div>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${selectedFlow.congestionPercent}%` }}
                  />
                </div>
              </div>

              <div className={styles.tableCard}>
                <h3>TomTom detail</h3>
                <dl className={styles.detailList}>
                  <div>
                    <dt>Road name</dt>
                    <dd>{selectedRoad.name || UNKNOWN_ROAD_NAME}</dd>
                  </div>
                  <div>
                    <dt>Free-flow travel time</dt>
                    <dd>{formatSeconds(selectedFlow.freeFlowTravelTime)}</dd>
                  </div>
                  <div>
                    <dt>Current travel time</dt>
                    <dd>{formatSeconds(selectedFlow.currentTravelTime)}</dd>
                  </div>
                  <div>
                    <dt>Road closure</dt>
                    <dd>{selectedFlow.roadClosure ? "Yes" : "No"}</dd>
                  </div>
                  <div>
                    <dt>Returned geometry</dt>
                    <dd>{selectedFlow.coordinates.length || 0} points</dd>
                  </div>
                </dl>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
