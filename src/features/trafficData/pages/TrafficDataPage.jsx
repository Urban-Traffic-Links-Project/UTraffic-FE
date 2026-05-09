import L from "leaflet";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GeoJSON, MapContainer, TileLayer, useMap } from "react-leaflet";
import styles from "./TrafficDataPage.module.css";

import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import ChevronLeftOutlinedIcon from "@mui/icons-material/ChevronLeftOutlined";
import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import TrafficOutlinedIcon from "@mui/icons-material/TrafficOutlined";
import HCMCMap from "../components/HCMMap";

const TOMTOM_API_KEY = import.meta.env.VITE_TOMTOM_API_KEY;
const TOMTOM_FLOW_SEGMENT_URL =
  "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json";

const ROAD_NETWORK_GEOJSON_URL = "/geojson/road_network_Quan1.geojson";

const DISTRICT_1_BOUNDS = [
  [10.753522, 106.672782],
  [10.793739, 106.71012],
];

const MAJOR_HIGHWAY_TYPES = new Set([
  "motorway",
  "trunk",
  "primary",
  "motorway_link",
  "trunk_link",
  "primary_link",
  "secondary",
  "tertiary",
]);

const sidebarItems = [
  {
    key: "map",
    label: "Visualized map",
    icon: <MapOutlinedIcon />,
  },
  {
    key: "stats",
    label: "Statistical data",
    icon: <BarChartOutlinedIcon />,
  },
];

function formatNumber(value, digits = 1) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) return "--";

  return numberValue.toFixed(digits);
}

function getFeatureCoordinates(feature) {
  const geometry = feature?.geometry;

  if (!geometry) return [];

  if (geometry.type === "Point") {
    return [geometry.coordinates];
  }

  if (geometry.type === "MultiPoint" || geometry.type === "LineString") {
    return geometry.coordinates;
  }

  if (geometry.type === "MultiLineString" || geometry.type === "Polygon") {
    return geometry.coordinates.flat();
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flat(2);
  }

  return [];
}

function getFeatureCenter(feature) {
  const coords = getFeatureCoordinates(feature);

  if (!coords.length) return null;

  const total = coords.reduce(
    (acc, coord) => {
      acc.lng += Number(coord[0]);
      acc.lat += Number(coord[1]);
      return acc;
    },
    { lng: 0, lat: 0 }
  );

  return {
    longitude: total.lng / coords.length,
    latitude: total.lat / coords.length,
  };
}

function getRoadName(feature) {
  const properties = feature?.properties || {};

  return (
    properties.name ||
    properties["name:vi"] ||
    properties["name:en"] ||
    properties.ref ||
    properties["@id"] ||
    "Đường chưa có tên"
  );
}

function getRoadId(feature) {
  return feature?.properties?.__selectorId || feature?.properties?.["@id"] || feature?.id;
}

function getHighwayType(feature) {
  return String(feature?.properties?.highway || "unknown").toLowerCase();
}

function isMajorRoad(feature) {
  return MAJOR_HIGHWAY_TYPES.has(getHighwayType(feature));
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

function getCongestionPercent(flow) {
  const currentSpeed = Number(flow?.currentSpeed);
  const freeFlowSpeed = Number(flow?.freeFlowSpeed);

  if (!Number.isFinite(currentSpeed) || !Number.isFinite(freeFlowSpeed) || freeFlowSpeed <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((1 - currentSpeed / freeFlowSpeed) * 100)));
}

function getDelaySeconds(flow) {
  const currentTravelTime = Number(flow?.currentTravelTime);
  const freeFlowTravelTime = Number(flow?.freeFlowTravelTime);

  if (!Number.isFinite(currentTravelTime) || !Number.isFinite(freeFlowTravelTime)) return null;

  return Math.max(0, currentTravelTime - freeFlowTravelTime);
}

function getStatusClassName(status) {
  if (status === "Road closed" || status === "Congested") return styles.statusDanger;
  if (status === "Moderate") return styles.statusWarning;
  return styles.statusSuccess;
}

function buildSelectedRoad(feature, latLng) {
  const center = getFeatureCenter(feature);
  const selectedPoint = latLng
    ? {
        latitude: latLng.lat,
        longitude: latLng.lng,
      }
    : center;

  return {
    id: getRoadId(feature),
    segment: getRoadName(feature),
    highway: getHighwayType(feature),
    latitude: selectedPoint?.latitude,
    longitude: selectedPoint?.longitude,
    feature,
  };
}

function normalizeTomTomFlow(selectedRoad, data) {
  const flow = data?.flowSegmentData || {};
  const status = getTrafficStatus(flow);
  const delaySeconds = getDelaySeconds(flow);

  return {
    id: selectedRoad.id,
    segment: selectedRoad.segment,
    highway: selectedRoad.highway,
    latitude: selectedRoad.latitude,
    longitude: selectedRoad.longitude,
    frc: flow.frc || "--",
    currentSpeed: Number(flow.currentSpeed),
    freeFlowSpeed: Number(flow.freeFlowSpeed),
    currentTravelTime: Number(flow.currentTravelTime),
    freeFlowTravelTime: Number(flow.freeFlowTravelTime),
    confidence: Number(flow.confidence),
    roadClosure: Boolean(flow.roadClosure),
    status,
    congestionPercent: getCongestionPercent(flow),
    delaySeconds,
  };
}

async function fetchTomTomFlowSegment(selectedRoad) {
  const params = new URLSearchParams({
    key: TOMTOM_API_KEY,
    point: `${selectedRoad.latitude},${selectedRoad.longitude}`,
    unit: "kmph",
    openLr: "false",
  });

  const response = await fetch(`${TOMTOM_FLOW_SEGMENT_URL}?${params.toString()}`);

  if (!response.ok) {
    let message = `TomTom request failed (${response.status})`;

    try {
      const errorBody = await response.json();
      message = errorBody?.detailedError?.message || errorBody?.error || message;
    } catch {
      // Keep the fallback error message.
    }

    throw new Error(message);
  }

  const data = await response.json();

  return normalizeTomTomFlow(selectedRoad, data);
}

function FitBounds({ bounds, dependency }) {
  const map = useMap();

  useEffect(() => {
    if (!bounds) return;

    const timer = setTimeout(() => {
      map.fitBounds(bounds, { padding: [18, 18] });
      map.invalidateSize();
    }, 120);

    return () => clearTimeout(timer);
  }, [bounds, dependency, map]);

  return null;
}

function RoadSelectorMap({ selectedRoad, searchKeyword, onRoadSelected }) {
  const [roadNetworkData, setRoadNetworkData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    setError("");

    fetch(ROAD_NETWORK_GEOJSON_URL)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Không tải được ${ROAD_NETWORK_GEOJSON_URL} (${res.status})`);
        }

        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;

        const indexedData = {
          ...data,
          features: (data.features || []).map((feature, index) => ({
            ...feature,
            properties: {
              ...(feature.properties || {}),
              __selectorId: feature.properties?.["@id"] || feature.id || `q1-road-${index}`,
            },
          })),
        };

        setRoadNetworkData(indexedData);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err?.message || "Không tải được dữ liệu đoạn đường Quận 1.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const normalizedSearchKeyword = searchKeyword.trim().toLowerCase();

  const matchedRoadIds = useMemo(() => {
    if (!roadNetworkData || !normalizedSearchKeyword) return new Set();

    return new Set(
      roadNetworkData.features
        .filter((feature) => {
          const name = getRoadName(feature).toLowerCase();
          const highway = getHighwayType(feature).toLowerCase();
          return name.includes(normalizedSearchKeyword) || highway.includes(normalizedSearchKeyword);
        })
        .map((feature) => getRoadId(feature))
    );
  }, [roadNetworkData, normalizedSearchKeyword]);

  const bounds = useMemo(() => {
    if (roadNetworkData?.features?.length) {
      return L.geoJSON(roadNetworkData).getBounds();
    }

    return L.latLngBounds(DISTRICT_1_BOUNDS);
  }, [roadNetworkData]);

  const matchCount = normalizedSearchKeyword ? matchedRoadIds.size : roadNetworkData?.features?.length || 0;

  const getRoadStyle = useCallback(
    (feature) => {
      const id = getRoadId(feature);
      const isSelected = id === selectedRoad?.id;
      const hasSearch = Boolean(normalizedSearchKeyword);
      const isMatched = !hasSearch || matchedRoadIds.has(id);
      const major = isMajorRoad(feature);

      if (isSelected) {
        return {
          color: "#2563eb",
          weight: 7,
          opacity: 1,
        };
      }

      if (!isMatched) {
        return {
          color: "#cbd5e1",
          weight: 1,
          opacity: 0.16,
        };
      }

      return {
        color: major ? "#16c784" : "#f4c430",
        weight: major ? 4 : 2,
        opacity: major ? 0.72 : 0.48,
      };
    },
    [matchedRoadIds, normalizedSearchKeyword, selectedRoad?.id]
  );

  const onEachRoadFeature = useCallback(
    (feature, layer) => {
      const name = getRoadName(feature);
      const highway = getHighwayType(feature);
      const roadId = getRoadId(feature);

      layer.on("click", (event) => {
        L.DomEvent.stopPropagation(event.originalEvent);
        onRoadSelected(buildSelectedRoad(feature, event.latlng));
      });

      layer.bindTooltip(name, { sticky: true });
      layer.bindPopup(`
        <strong>${name}</strong><br />
        Loại đường: ${highway}<br />
        Mã OSM: ${roadId}<br />
        Click đoạn đường để lấy dữ liệu TomTom
      `);
    },
    [onRoadSelected]
  );

  if (isLoading) {
    return <div className={styles.selectorLoading}>Đang tải bản đồ chọn đoạn đường Quận 1...</div>;
  }

  if (error) {
    return <div className={styles.errorBox}>{error}</div>;
  }

  return (
    <div className={styles.roadSelectorMapWrap}>
      <MapContainer
        bounds={bounds}
        minZoom={12}
        scrollWheelZoom={true}
        className={styles.roadSelectorMap}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {roadNetworkData && (
          <GeoJSON
            key={`q1-road-selector-${selectedRoad?.id || "none"}-${normalizedSearchKeyword}`}
            data={roadNetworkData}
            style={getRoadStyle}
            onEachFeature={onEachRoadFeature}
          />
        )}

        <FitBounds bounds={bounds} dependency={roadNetworkData?.features?.length} />
      </MapContainer>

      <div className={styles.selectorMapLegend}>
        <span className={styles.legendSelectedLine} /> Đoạn đang chọn
        <span className={styles.legendMajorLine} /> Đường chính
        <span className={styles.legendMinorLine} /> Đường phụ
      </div>
    </div>
  );
}

export function TrafficDataPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarTheme, setSidebarTheme] = useState("dark");
  const [activeView, setActiveView] = useState("map");
  const [roadSearchKeyword, setRoadSearchKeyword] = useState("");
  const [selectedRoad, setSelectedRoad] = useState(null);
  const [selectedRoadFlow, setSelectedRoadFlow] = useState(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const sidebarClassName = useMemo(() => {
    return [
      styles.sidebar,
      sidebarTheme === "dark" ? styles.sidebarDark : styles.sidebarLight,
      isSidebarCollapsed ? styles.sidebarCollapsed : "",
    ].join(" ");
  }, [sidebarTheme, isSidebarCollapsed]);

  const loadSelectedRoadTrafficStats = useCallback(async (road) => {
    if (!road) {
      setStatsError("Chọn một đoạn đường trên bản đồ Quận 1 trước khi lấy dữ liệu.");
      return;
    }

    if (!TOMTOM_API_KEY) {
      setStatsError("Chưa cấu hình VITE_TOMTOM_API_KEY trong file .env.");
      setSelectedRoadFlow(null);
      setLastUpdatedAt(null);
      return;
    }

    if (!Number.isFinite(Number(road.latitude)) || !Number.isFinite(Number(road.longitude))) {
      setStatsError("Đoạn đường được chọn không có tọa độ hợp lệ.");
      setSelectedRoadFlow(null);
      setLastUpdatedAt(null);
      return;
    }

    setIsStatsLoading(true);
    setStatsError("");

    try {
      const flow = await fetchTomTomFlowSegment(road);
      setSelectedRoadFlow(flow);
      setLastUpdatedAt(new Date());
    } catch (error) {
      setSelectedRoadFlow(null);
      setLastUpdatedAt(null);
      setStatsError(error?.message || "Không lấy được dữ liệu TomTom cho đoạn đường đã chọn.");
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  const handleRoadSelected = useCallback(
    (road) => {
      setSelectedRoad(road);
      setSelectedRoadFlow(null);
      setLastUpdatedAt(null);
      loadSelectedRoadTrafficStats(road);
    },
    [loadSelectedRoadTrafficStats]
  );

  const statisticalCards = useMemo(() => {
    return [
      {
        id: 1,
        title: "Current Speed",
        value: selectedRoadFlow ? `${formatNumber(selectedRoadFlow.currentSpeed)} km/h` : "--",
        icon: <TimelineOutlinedIcon />,
        description: "Tốc độ hiện tại của đoạn đường đang chọn theo TomTom Traffic Flow.",
      },
      {
        id: 2,
        title: "Congestion Level",
        value: selectedRoadFlow ? `${selectedRoadFlow.congestionPercent}%` : "--",
        icon: <TrafficOutlinedIcon />,
        description: "Mức giảm tốc so với tốc độ free-flow của cùng road fragment.",
      },
      {
        id: 3,
        title: "Data Confidence",
        value: selectedRoadFlow ? formatNumber(selectedRoadFlow.confidence, 2) : "--",
        icon: <InsightsOutlinedIcon />,
        description: "Độ tin cậy dữ liệu trả về từ TomTom cho đoạn đường đã chọn.",
      },
    ];
  }, [selectedRoadFlow]);

  const chartRows = useMemo(() => {
    if (!selectedRoadFlow) return [];

    const maxSpeed = Math.max(
      Number(selectedRoadFlow.currentSpeed) || 0,
      Number(selectedRoadFlow.freeFlowSpeed) || 0,
      1
    );

    return [
      {
        id: "currentSpeed",
        label: "Current speed",
        value: selectedRoadFlow.currentSpeed,
        unit: "km/h",
        percent: Math.round(((Number(selectedRoadFlow.currentSpeed) || 0) / maxSpeed) * 100),
      },
      {
        id: "freeFlowSpeed",
        label: "Free-flow speed",
        value: selectedRoadFlow.freeFlowSpeed,
        unit: "km/h",
        percent: Math.round(((Number(selectedRoadFlow.freeFlowSpeed) || 0) / maxSpeed) * 100),
      },
      {
        id: "delay",
        label: "Delay",
        value: selectedRoadFlow.delaySeconds,
        unit: "s",
        percent: selectedRoadFlow.currentTravelTime
          ? Math.round(((Number(selectedRoadFlow.delaySeconds) || 0) / selectedRoadFlow.currentTravelTime) * 100)
          : 0,
      },
    ];
  }, [selectedRoadFlow]);

  const lastUpdatedLabel = lastUpdatedAt
    ? lastUpdatedAt.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "--";

  return (
    <div className={`${styles.page} ${isSidebarCollapsed ? styles.pageCollapsed : ""}`}>
      <aside className={sidebarClassName}>
        <div className={styles.sidebarTop}>
          <button
            className={styles.sidebarToggle}
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRightOutlinedIcon /> : <ChevronLeftOutlinedIcon />}
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              className={`${styles.sidebarNavItem} ${
                activeView === item.key ? styles.sidebarNavItemActive : ""
              }`}
              onClick={() => setActiveView(item.key)}
              title={item.label}
            >
              <span className={styles.sidebarNavIcon}>{item.icon}</span>
              {!isSidebarCollapsed && <span className={styles.sidebarNavLabel}>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.themeSwitcher}>
            <button
              className={`${styles.themeButton} ${
                sidebarTheme === "light" ? styles.themeButtonActive : ""
              }`}
              onClick={() => setSidebarTheme("light")}
              title="Light sidebar"
            >
              <LightModeOutlinedIcon />
              {!isSidebarCollapsed && <span>Light</span>}
            </button>

            <button
              className={`${styles.themeButton} ${
                sidebarTheme === "dark" ? styles.themeButtonActive : ""
              }`}
              onClick={() => setSidebarTheme("dark")}
              title="Dark sidebar"
            >
              <DarkModeOutlinedIcon />
              {!isSidebarCollapsed && <span>Dark</span>}
            </button>
          </div>
        </div>
      </aside>

      <section className={styles.contentArea}>
        {activeView === "map" ? (
          <div className={styles.mapView}>
            <div className={styles.mapPanel}>
              <div className={styles.mapCanvas}>
                <HCMCMap isSidebarCollapsed={isSidebarCollapsed} />
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.statsView}>
            <div className={styles.statsHeader}>
              <div>
                <h2>Traffic Statistical Data</h2>
                <p>
                  Chọn một đoạn đường trực tiếp trên bản đồ Quận 1 bên dưới để lấy thông tin giao
                  thông realtime từ TomTom. Chức năng này tách biệt với bản đồ tô màu giao thông.
                </p>
              </div>
            </div>

            {statsError && <div className={styles.errorBox}>{statsError}</div>}

            <div className={styles.roadSelectorPanel}>
              <div className={styles.selectorHeader}>
                <div>
                  <h3>Chọn đoạn đường Quận 1</h3>
                  <p>Click trực tiếp lên line của đoạn đường để xem dữ liệu TomTom.</p>
                </div>

                <input
                  className={styles.roadSearchInput}
                  value={roadSearchKeyword}
                  onChange={(event) => setRoadSearchKeyword(event.target.value)}
                  placeholder="Tìm theo tên đường, ví dụ: Nguyễn Huệ"
                />
              </div>

              <div className={styles.selectorGrid}>
                <RoadSelectorMap
                  selectedRoad={selectedRoad}
                  searchKeyword={roadSearchKeyword}
                  onRoadSelected={handleRoadSelected}
                />

                <div className={styles.selectedRoadCard}>
                  <span className={styles.selectedRoadLabel}>Đoạn đường đang chọn</span>
                  <h3>{selectedRoad?.segment || "Chưa chọn đoạn đường"}</h3>

                  {selectedRoad ? (
                    <div className={styles.selectedRoadMeta}>
                      <span>Loại đường: {selectedRoad.highway}</span>
                      <span>
                        Tọa độ lấy mẫu: {formatNumber(selectedRoad.latitude, 6)}, {" "}
                        {formatNumber(selectedRoad.longitude, 6)}
                      </span>
                      <span>Mã OSM: {selectedRoad.id}</span>
                    </div>
                  ) : (
                    <p className={styles.selectorHint}>
                      Hãy zoom/pan bản đồ bên trái rồi click vào một đoạn đường trong Quận 1.
                    </p>
                  )}

                  {selectedRoadFlow && (
                    <div className={styles.selectedRoadStatusRow}>
                      <span
                        className={`${styles.statusBadge} ${getStatusClassName(
                          selectedRoadFlow.status
                        )}`}
                      >
                        {selectedRoadFlow.status}
                      </span>
                      <strong>{selectedRoadFlow.congestionPercent}% congestion</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.statsCards}>
              {statisticalCards.map((card) => (
                <div className={styles.statCard} key={card.id}>
                  <div className={styles.statCardIcon}>{card.icon}</div>
                  <div className={styles.statCardContent}>
                    <h3>{card.title}</h3>
                    <strong>
                      {isStatsLoading && selectedRoad && !selectedRoadFlow ? "Loading..." : card.value}
                    </strong>
                    <p>{card.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.chartCard}>
                <div className={styles.blockHeader}>
                  <h3>Selected segment metrics</h3>
                  <span>TomTom realtime</span>
                </div>

                <div className={styles.barChart}>
                  {chartRows.length ? (
                    chartRows.map((row) => (
                      <div className={styles.barItem} key={row.id}>
                        <span title={row.label}>{row.label}</span>
                        <div className={styles.barTrack}>
                          <div className={styles.barFill} style={{ width: `${row.percent}%` }} />
                        </div>
                        <strong className={styles.barValue}>
                          {row.value === null ? "--" : `${formatNumber(row.value)}${row.unit}`}
                        </strong>
                      </div>
                    ))
                  ) : (
                    <div className={styles.emptyState}>
                      {isStatsLoading
                        ? "Đang tải dữ liệu TomTom..."
                        : "Chọn một đoạn đường trên bản đồ Quận 1 để xem biểu đồ."}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.tableCard}>
                <div className={styles.blockHeader}>
                  <h3>Selected road segment</h3>
                  <span>Flow Segment Data</span>
                </div>

                <div className={styles.tableWrapper}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Road Segment</th>
                        <th>Current Speed</th>
                        <th>Free Flow</th>
                        <th>Delay</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRoadFlow ? (
                        <tr>
                          <td>
                            <strong>{selectedRoadFlow.segment}</strong>
                            <span className={styles.tableSubText}>
                              FRC: {selectedRoadFlow.frc} · {selectedRoadFlow.highway}
                            </span>
                          </td>
                          <td>{formatNumber(selectedRoadFlow.currentSpeed)} km/h</td>
                          <td>{formatNumber(selectedRoadFlow.freeFlowSpeed)} km/h</td>
                          <td>
                            {selectedRoadFlow.delaySeconds === null
                              ? "--"
                              : `${Math.round(selectedRoadFlow.delaySeconds)}s`}
                          </td>
                          <td>
                            <span
                              className={`${styles.statusBadge} ${getStatusClassName(
                                selectedRoadFlow.status
                              )}`}
                            >
                              {selectedRoadFlow.status}
                            </span>
                          </td>
                        </tr>
                      ) : (
                        <tr>
                          <td colSpan="5">
                            <div className={styles.emptyState}>
                              {isStatsLoading
                                ? "Đang tải dữ liệu TomTom..."
                                : "Chưa có dữ liệu. Hãy chọn một đoạn đường trên bản đồ Quận 1."}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
