import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./TrafficDashboardPage.module.css";

import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import AutoGraphOutlinedIcon from "@mui/icons-material/AutoGraphOutlined";
import CachedOutlinedIcon from "@mui/icons-material/CachedOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import TrafficOutlinedIcon from "@mui/icons-material/TrafficOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const TRAFFIC_DATA_PATH = "/traffic-data";

const HISTORY_OPTIONS = [
  { label: "24 hours", value: 24 },
  { label: "3 days", value: 72 },
  { label: "7 days", value: 168 },
];

function buildApiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

async function fetchJson(path, options = {}) {
  const response = await fetch(buildApiUrl(path), {
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      `The dashboard data could not be loaded (${response.status}).`;
    throw new Error(message);
  }

  return data;
}

function formatNumber(value, digits = 1) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "--";
  return numberValue.toFixed(digits);
}

function formatInteger(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "0";
  return new Intl.NumberFormat("vi-VN").format(Math.round(numberValue));
}

function formatSeconds(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "--";

  if (numberValue < 60) return `${Math.round(numberValue)}s`;

  const minutes = Math.floor(numberValue / 60);
  const seconds = Math.round(numberValue % 60);

  if (minutes < 60) return `${minutes}m ${seconds}s`;

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return `${hours}h ${restMinutes}m`;
}

function formatDistance(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "--";
  if (numberValue < 1000) return `${Math.round(numberValue)} m`;
  return `${formatNumber(numberValue / 1000, 2)} km`;
}

function formatDateTime(value) {
  if (!value) return "--";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTimeLabel(value) {
  if (!value) return "--";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeStatus(status) {
  return String(status || "unknown").trim().toLowerCase();
}

function getStatusLabel(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "road_closed") return "Road closed";
  if (normalized === "congested") return "Congested";
  if (normalized === "moderate") return "Moderate";
  if (normalized === "stable") return "Stable";

  return "Unknown";
}

function getStatusClassName(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "road_closed" || normalized === "congested") {
    return styles.statusDanger;
  }

  if (normalized === "moderate") return styles.statusWarning;
  if (normalized === "stable") return styles.statusSuccess;

  return styles.statusNeutral;
}

function getIncidentLabel(type) {
  const value = String(type || "").trim();
  if (!value) return "Incident";
  return value;
}

function EmptyState({ icon, title, description }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>{icon}</div>
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  );
}

function LoadingBlock({ text = "Loading data..." }) {
  return <div className={styles.loadingBlock}>{text}</div>;
}

function KpiCard({ icon, label, value, helper, tone = "default" }) {
  return (
    <div className={`${styles.kpiCard} ${styles[`kpi${tone}`] || ""}`}>
      <div className={styles.kpiIcon}>{icon}</div>
      <div className={styles.kpiBody}>
        <span>{label}</span>
        <strong>{value}</strong>
        {helper && <small>{helper}</small>}
      </div>
    </div>
  );
}

function LineChart({ data, valueKey, secondaryKey, label, secondaryLabel, unit }) {
  const chartData = Array.isArray(data) ? data : [];
  const width = 760;
  const height = 260;
  const padding = 34;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const values = chartData
    .flatMap((item) => [Number(item?.[valueKey]), Number(item?.[secondaryKey])])
    .filter((value) => Number.isFinite(value));

  const maxValue = values.length ? Math.max(...values, 1) : 1;
  const minValue = 0;

  const toX = (index) => {
    if (chartData.length <= 1) return padding + innerWidth / 2;
    return padding + (index / (chartData.length - 1)) * innerWidth;
  };

  const toY = (value) => {
    const numberValue = Number(value);
    const safeValue = Number.isFinite(numberValue) ? numberValue : minValue;
    return padding + innerHeight - ((safeValue - minValue) / (maxValue - minValue || 1)) * innerHeight;
  };

  const buildPath = (key) =>
    chartData
      .map((item, index) => {
        const x = toX(index);
        const y = toY(item?.[key]);
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

  if (!chartData.length) {
    return (
      <EmptyState
        icon={<TimelineOutlinedIcon />}
        title="No historical data available"
        description="Please run collect-now or wait for the scheduler to save a periodic snapshot."
      />
    );
  }

  return (
    <div className={styles.chartBox}>
      <div className={styles.chartLegend}>
        <span><i className={styles.linePrimary} />{label}</span>
        {secondaryKey && <span><i className={styles.lineSecondary} />{secondaryLabel}</span>}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className={styles.lineChart} role="img">
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} />

        {[0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding + innerHeight - ratio * innerHeight;
          return (
            <g key={ratio}>
              <line className={styles.gridLine} x1={padding} y1={y} x2={width - padding} y2={y} />
              <text x={8} y={y + 4}>{formatNumber(maxValue * ratio, 0)}</text>
            </g>
          );
        })}

        {secondaryKey && <path className={styles.secondaryPath} d={buildPath(secondaryKey)} />}
        <path className={styles.primaryPath} d={buildPath(valueKey)} />

        {chartData.map((item, index) => (
          <g key={`${item.bucket}-${index}`}>
            <circle className={styles.primaryPoint} cx={toX(index)} cy={toY(item?.[valueKey])} r="4" />
            {secondaryKey && (
              <circle className={styles.secondaryPoint} cx={toX(index)} cy={toY(item?.[secondaryKey])} r="3" />
            )}
            {index === 0 || index === chartData.length - 1 || index % Math.ceil(chartData.length / 5) === 0 ? (
              <text className={styles.xLabel} x={toX(index)} y={height - 8} textAnchor="middle">
                {formatTimeLabel(item.bucket)}
              </text>
            ) : null}
          </g>
        ))}

        <text className={styles.unitLabel} x={width - padding} y={padding - 12} textAnchor="end">
          {unit}
        </text>
      </svg>
    </div>
  );
}

function TopCongestedTable({ rows }) {
  if (!rows.length) {
    return (
      <EmptyState
        icon={<TrafficOutlinedIcon />}
        title="No congested segments data available"
        description="The dashboard needs the latest snapshot to rank road segments."
      />
    );
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>#</th>
            <th>Segment</th>
            <th>Speed</th>
            <th>Delay</th>
            <th>Congestion</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.segment_id || index}>
              <td>{index + 1}</td>
              <td>
                <div className={styles.roadCell}>
                  <strong>{row.road_name || "Unnamed road section"}</strong>
                  <span>{formatNumber(row.lat, 5)}, {formatNumber(row.lon, 5)}</span>
                </div>
              </td>
              <td>{formatNumber(row.current_speed)} km/h</td>
              <td>{formatSeconds(row.delay_seconds)}</td>
              <td>
                <div className={styles.congestionCell}>
                  <span>{formatNumber(row.congestion_percent, 0)}%</span>
                  <div className={styles.miniTrack}>
                    <i style={{ width: `${Math.max(0, Math.min(100, Number(row.congestion_percent) || 0))}%` }} />
                  </div>
                </div>
              </td>
              <td>
                <span className={`${styles.statusBadge} ${getStatusClassName(row.status)}`}>
                  {getStatusLabel(row.status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IncidentList({ incidents }) {
  if (!incidents.length) {
    return (
      <EmptyState
        icon={<ReportProblemOutlinedIcon />}
        title="No incident warnings have been issued."
        description="If TomTom does not return any incidents in the area, this list will be empty."
      />
    );
  }

  return (
    <div className={styles.incidentList}>
      {incidents.map((incident, index) => (
        <article className={styles.incidentItem} key={`${incident.incident_type}-${index}`}>
          <div className={styles.incidentIcon}><WarningAmberOutlinedIcon /></div>
          <div className={styles.incidentContent}>
            <div className={styles.incidentTopline}>
              <strong>{incident.road_name || "Khu vực chưa xác định"}</strong>
              <span>Magnitude {incident.magnitude ?? "--"}</span>
            </div>
            <p>{incident.description || getIncidentLabel(incident.incident_type)}</p>
            <div className={styles.incidentMeta}>
              <span>Delay: {formatSeconds(incident.delay_seconds)}</span>
              <span>Length: {formatDistance(incident.length_m)}</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function TrafficDashboardPage() {
  const [historyHours, setHistoryHours] = useState(24);
  const [overview, setOverview] = useState(null);
  const [topCongested, setTopCongested] = useState([]);
  const [history, setHistory] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollecting, setIsCollecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [lastLoadedAt, setLastLoadedAt] = useState(null);

  const loadDashboard = useCallback(async () => {
    setErrorMsg("");
    setIsLoading(true);

    try {
      const [overviewData, topData, historyData, incidentsData] = await Promise.all([
        fetchJson("/api/v1/traffic-dashboard/overview"),
        fetchJson("/api/v1/traffic-dashboard/top-congested?limit=10"),
        fetchJson(`/api/v1/traffic-dashboard/history?hours=${historyHours}`),
        fetchJson("/api/v1/traffic-dashboard/incidents"),
      ]);

      setOverview(overviewData || null);
      setTopCongested(Array.isArray(topData) ? topData : []);
      setHistory(Array.isArray(historyData) ? historyData : []);
      setIncidents(Array.isArray(incidentsData) ? incidentsData : []);
      setLastLoadedAt(new Date());
    } catch (error) {
      setErrorMsg(error?.message || "The dashboard data could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [historyHours]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleCollectNow = async () => {
    setErrorMsg("");
    setIsCollecting(true);

    try {
      await fetchJson("/api/v1/traffic-dashboard/collect-now", {
        method: "POST",
      });

      await loadDashboard();
    } catch (error) {
      setErrorMsg(error?.message || "Unable to retrieve data from TomTom");
    } finally {
      setIsCollecting(false);
    }
  };

  const statusTotal = useMemo(() => {
    const stable = Number(overview?.stable_segments || 0);
    const moderate = Number(overview?.moderate_segments || 0);
    const congested = Number(overview?.congested_segments || 0);
    const closures = Number(overview?.road_closures || 0);
    return Math.max(1, stable + moderate + congested + closures);
  }, [overview]);

  const lastUpdatedLabel = formatDateTime(overview?.last_updated_at);
  const lastLoadedLabel = lastLoadedAt ? formatDateTime(lastLoadedAt) : "--";

  return (
    <main className={styles.page}>
      <section className={styles.heroSection}>
        <div>
          <span className={styles.kicker}>Traffic Dashboard</span>
          <h1>Overview of traffic in Ho Chi Minh City</h1>
        </div>

        <div className={styles.heroActions}>
          <Link to={TRAFFIC_DATA_PATH} className={styles.secondaryButton}>
            <MapOutlinedIcon />
            View detailed map
          </Link>
          <button className={styles.primaryButton} onClick={loadDashboard} disabled={isLoading || isCollecting}>
            <CachedOutlinedIcon />
            Refresh
          </button>
          <button className={styles.darkButton} onClick={handleCollectNow} disabled={isLoading || isCollecting}>
            <AutoGraphOutlinedIcon />
            {isCollecting ? "Collecting..." : "Collect now"}
          </button>
        </div>
      </section>

      {errorMsg && (
        <div className={styles.errorBanner}>
          <ErrorOutlineOutlinedIcon />
          <span>{errorMsg}</span>
        </div>
      )}

      <section className={styles.metaBar}>
        <span>Last snapshot: <strong>{lastUpdatedLabel}</strong></span>
        <span>Last loaded: <strong>{lastLoadedLabel}</strong></span>
        <span>Monitored segments: <strong>{formatInteger(overview?.monitored_segments)}</strong></span>
      </section>

      <section className={styles.kpiGrid}>
        <KpiCard
          icon={<SpeedOutlinedIcon />}
          label="Average speed"
          value={`${formatNumber(overview?.average_speed)} km/h`}
          helper="Average from the latest snapshot"
          tone="Blue"
        />
        <KpiCard
          icon={<AccessTimeOutlinedIcon />}
          label="Average delay"
          value={formatSeconds(overview?.average_delay_seconds)}
          helper="Current travel time - free-flow"
          tone="Amber"
        />
        <KpiCard
          icon={<TrafficOutlinedIcon />}
          label="Congested segments"
          value={formatInteger(overview?.congested_segments)}
          helper={`Moderate: ${formatInteger(overview?.moderate_segments)}`}
          tone="Red"
        />
        <KpiCard
          icon={<WarningAmberOutlinedIcon />}
          label="Road closures"
          value={formatInteger(overview?.road_closures)}
          helper={`${formatInteger(incidents.length)} current incidents`}
          tone="Purple"
        />
      </section>

      <section className={styles.contentGrid}>
        <div className={styles.leftColumn}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <span className={styles.sectionLabel}>History / Report</span>
                <h2>Speed and Delay Over Time</h2>
              </div>
              <select
                className={styles.select}
                value={historyHours}
                onChange={(event) => setHistoryHours(Number(event.target.value))}
              >
                {HISTORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            {isLoading ? (
              <LoadingBlock />
            ) : (
              <LineChart
                data={history}
                valueKey="average_speed"
                secondaryKey="average_delay_seconds"
                label="Average speed"
                secondaryLabel="Average delay"
                unit="km/h / seconds"
              />
            )}
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <span className={styles.sectionLabel}>Ranking</span>
                <h2>Top Most Congested Segments</h2>
              </div>
              <span className={styles.cardHint}>Latest snapshot</span>
            </div>
            {isLoading ? <LoadingBlock /> : <TopCongestedTable rows={topCongested} />}
          </section>
        </div>

        <aside className={styles.rightColumn}>
          <section className={styles.card}>
            <div className={styles.cardHeaderCompact}>
              <div>
                <span className={styles.sectionLabel}>Status ratio</span>
                <h2>Phân bố trạng thái</h2>
              </div>
            </div>

            <div className={styles.statusBars}>
              <div>
                <span>Stable</span>
                <strong>{formatInteger(overview?.stable_segments)}</strong>
                <div className={styles.statusTrack}><i className={styles.successBar} style={{ width: `${(Number(overview?.stable_segments || 0) / statusTotal) * 100}%` }} /></div>
              </div>
              <div>
                <span>Moderate</span>
                <strong>{formatInteger(overview?.moderate_segments)}</strong>
                <div className={styles.statusTrack}><i className={styles.warningBar} style={{ width: `${(Number(overview?.moderate_segments || 0) / statusTotal) * 100}%` }} /></div>
              </div>
              <div>
                <span>Congested</span>
                <strong>{formatInteger(overview?.congested_segments)}</strong>
                <div className={styles.statusTrack}><i className={styles.dangerBar} style={{ width: `${(Number(overview?.congested_segments || 0) / statusTotal) * 100}%` }} /></div>
              </div>
              <div>
                <span>Road closed</span>
                <strong>{formatInteger(overview?.road_closures)}</strong>
                <div className={styles.statusTrack}><i className={styles.closedBar} style={{ width: `${(Number(overview?.road_closures || 0) / statusTotal) * 100}%` }} /></div>
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeaderCompact}>
              <div>
                <span className={styles.sectionLabel}>Incidents</span>
                <h2>Cảnh báo sự cố</h2>
              </div>
              <span className={styles.cardHint}>{formatInteger(incidents.length)} items</span>
            </div>
            {isLoading ? <LoadingBlock /> : <IncidentList incidents={incidents} />}
          </section>
        </aside>
      </section>
    </main>
  );
}
