/**
 * src/features/routeMonitor/pages/RouteMonitorPage.jsx
 * Trang theo dõi kẹt xe tuyến đường cố định A→B (Xa lộ Hà Nội, TP. Thủ Đức).
 *
 * Tính năng:
 *  - Realtime: polling mỗi 60s, hiển thị trạng thái tuyến mới nhất
 *  - Time-travel: chọn ngày giờ để xem dữ liệu lịch sử tại thời điểm đó
 *  - Biểu đồ lịch sử congestion % cho điểm A và B
 *  - Nút thu thập thủ công
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { CongestionChart } from "../components/CongestionChart";
import { RouteMap } from "../components/RouteMap";
import { TimeTravelControl } from "../components/TimeTravelControl";
import styles from "./RouteMonitorPage.module.css";
import {
  fetchRouteHistory,
  fetchRouteStatus,
  fetchSnapshotAt,
  triggerCollect,
} from "../api/routeMonitorApi";

const POLL_INTERVAL_MS = 60_000; // 60 giây

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatVN(isoString) {
  if (!isoString) return "--";
  try {
    return new Date(isoString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh",
    });
  } catch {
    return "--";
  }
}

function formatSpeed(v) {
  if (v == null) return "--";
  return `${Number(v).toFixed(1)} km/h`;
}

function formatPercent(v) {
  if (v == null) return "--";
  return `${Number(v).toFixed(1)}%`;
}

function formatDelay(seconds) {
  if (seconds == null) return "--";
  const s = Math.round(Number(seconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m} phút`;
}

const STATUS_LABELS = {
  stable: "Thông thoáng",
  moderate: "Chậm",
  congested: "Kẹt xe",
  road_closed: "Đóng đường",
  unknown: "Không rõ",
};

const STATUS_CLASSES = {
  stable: styles.statusStable,
  moderate: styles.statusModerate,
  congested: styles.statusCongested,
  road_closed: styles.statusCongested,
  unknown: styles.statusUnknown,
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status, large = false }) {
  const cls = STATUS_CLASSES[status] || styles.statusUnknown;
  return (
    <span className={`${styles.statusBadge} ${cls} ${large ? styles.statusBadgeLarge : ""}`}>
      {STATUS_LABELS[status] || "Không rõ"}
    </span>
  );
}

function MetricCard({ icon, label, value, sub, statusClass }) {
  return (
    <div className={`${styles.metricCard} ${statusClass || ""}`}>
      <span className={styles.metricIcon}>{icon}</span>
      <div className={styles.metricBody}>
        <span className={styles.metricLabel}>{label}</span>
        <strong className={styles.metricValue}>{value}</strong>
        {sub && <span className={styles.metricSub}>{sub}</span>}
      </div>
    </div>
  );
}

function PointCard({ point }) {
  if (!point) return null;
  const status = point.status || "unknown";
  return (
    <div className={`${styles.pointCard} ${STATUS_CLASSES[status] ? styles[`pointCard_${status}`] : ""}`}>
      <div className={styles.pointHeader}>
        <span className={styles.pointLabel}>Điểm {point.point_label}</span>
        <StatusBadge status={status} />
      </div>
      <div className={styles.pointRow}>
        <span>Tốc độ</span>
        <strong>{formatSpeed(point.current_speed)}</strong>
      </div>
      <div className={styles.pointRow}>
        <span>Kẹt xe</span>
        <strong>{formatPercent(point.congestion_percent)}</strong>
      </div>
      <div className={styles.pointRow}>
        <span>Trễ</span>
        <strong>{formatDelay(point.delay_seconds)}</strong>
      </div>
      {point.captured_at && (
        <div className={styles.pointTime}>
          📸 {formatVN(point.captured_at)}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function RouteMonitorPage() {
  const [mode, setMode] = useState("live"); // "live" | "history"
  const [currentData, setCurrentData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [historyRange, setHistoryRange] = useState(24);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const [error, setError] = useState("");
  const [collectMsg, setCollectMsg] = useState("");
  const [viewingAt, setViewingAt] = useState(null); // ISO string snapshot thực tế đang xem

  const pollRef = useRef(null);

  // ── Lấy dữ liệu realtime ──────────────────────────────────────────────────
  const loadLiveStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    setError("");
    try {
      const data = await fetchRouteStatus();
      setCurrentData(data);
    } catch (err) {
      setError(err.message || "Không thể tải dữ liệu trạng thái tuyến đường.");
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  // ── Lấy lịch sử ──────────────────────────────────────────────────────────
  const loadHistory = useCallback(async (hours) => {
    setIsLoadingHistory(true);
    try {
      const data = await fetchRouteHistory(hours);
      setHistoryData(data);
    } catch (err) {
      console.error("History load error:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // ── Polling live mỗi 60s ──────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "live") return;

    loadLiveStatus();
    loadHistory(historyRange);

    pollRef.current = setInterval(() => {
      loadLiveStatus();
      loadHistory(historyRange);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(pollRef.current);
  }, [mode, historyRange, loadLiveStatus, loadHistory]);

  // ── Khi thay đổi range history ─────────────────────────────────────────────
  const handleRangeChange = useCallback(
    (hours) => {
      setHistoryRange(hours);
      loadHistory(hours);
    },
    [loadHistory]
  );

  // ── Time-travel: xem dữ liệu tại thời điểm chỉ định ──────────────────────
  const handleViewAt = useCallback(async (isoString) => {
    clearInterval(pollRef.current);
    setMode("history");
    setIsLoadingStatus(true);
    setError("");
    try {
      const data = await fetchSnapshotAt(isoString);
      setCurrentData(data);
      setViewingAt(data.actual_captured_at || isoString);
    } catch (err) {
      if (err.message.includes("404") || err.message.includes("Không có")) {
        setError(`Không tìm thấy dữ liệu trong khoảng ±30 phút xung quanh thời điểm đã chọn.`);
      } else {
        setError(err.message || "Lỗi khi tải dữ liệu lịch sử.");
      }
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  // ── Quay về live ──────────────────────────────────────────────────────────
  const handleBackToLive = useCallback(() => {
    setMode("live");
    setViewingAt(null);
    setError("");
  }, []);

  // ── Thu thập thủ công ─────────────────────────────────────────────────────
  const handleCollect = useCallback(async () => {
    setIsCollecting(true);
    setCollectMsg("");
    try {
      const result = await triggerCollect();
      setCollectMsg(`✅ Đã thu thập ${result.created} snapshots`);
      // Reload sau khi collect
      await loadLiveStatus();
      await loadHistory(historyRange);
    } catch (err) {
      setCollectMsg(`❌ ${err.message || "Lỗi thu thập"}`);
    } finally {
      setIsCollecting(false);
      setTimeout(() => setCollectMsg(""), 5000);
    }
  }, [loadLiveStatus, loadHistory, historyRange]);

  // ── Derived data ─────────────────────────────────────────────────────────
  const points = currentData?.points || [];
  const pointA = points.find((p) => p.point_label === "A") || null;
  const pointB = points.find((p) => p.point_label === "B") || null;
  const overallStatus = currentData?.overall_status || "unknown";

  return (
    <div className={styles.page}>
      {/* History mode banner */}
      {mode === "history" && (
        <div className={styles.historyBanner}>
          <span>⏰</span>
          <span>
            Chế độ xem lịch sử
            {viewingAt ? ` — Dữ liệu lúc ${formatVN(viewingAt)}` : ""}
          </span>
          <button className={styles.bannerBackBtn} onClick={handleBackToLive}>
            Quay về trực tiếp ✕
          </button>
        </div>
      )}

      <div className={styles.layout}>
        {/* ── Left: Map ── */}
        <div className={styles.mapPanel}>
          <RouteMap
            statusA={pointA?.status || "unknown"}
            statusB={pointB?.status || "unknown"}
            overallStatus={overallStatus}
            isHistoryMode={mode === "history"}
            dataA={pointA}
            dataB={pointB}
          />
        </div>

        {/* ── Right: Info Panel ── */}
        <aside className={styles.infoPanel}>
          {/* Header */}
          <div className={styles.panelHeader}>
            <div className={styles.routeLabel}>🛣️ Theo dõi tuyến đường</div>
            <h1 className={styles.routeName}>Xa lộ Hà Nội — TP. Thủ Đức</h1>
            <p className={styles.routeDesc}>
              Điểm A (10°47&apos;40.9&quot;N) → Điểm B (10°47&apos;17.0&quot;N)
            </p>
          </div>

          {/* Status overview */}
          <div className={styles.overviewCard}>
            <div className={styles.overviewRow}>
              <div>
                <div className={styles.overviewLabel}>Trạng thái tổng thể</div>
                <StatusBadge status={overallStatus} large />
              </div>
              <div className={styles.overviewRight}>
                <div className={styles.overviewLabel}>
                  {mode === "live" ? "Cập nhật lúc" : "Dữ liệu tại"}
                </div>
                <div className={styles.overviewTime}>
                  {isLoadingStatus
                    ? "Đang tải..."
                    : formatVN(currentData?.captured_at)}
                </div>
                {mode === "live" && (
                  <div className={styles.liveIndicator}>
                    <span className={styles.liveDot} />
                    LIVE
                  </div>
                )}
              </div>
            </div>

            {!currentData?.has_data && !isLoadingStatus && (
              <div className={styles.noDataHint}>
                📭 Chưa có dữ liệu. Nhấn &quot;Thu thập ngay&quot; để bắt đầu.
              </div>
            )}
          </div>

          {/* Error */}
          {error && <div className={styles.errorBox}>{error}</div>}

          {/* Metrics grid */}
          {currentData?.has_data && (
            <div className={styles.metricsGrid}>
              <MetricCard
                icon="🚗"
                label="Tốc độ trung bình"
                value={formatSpeed(currentData.average_speed)}
              />
              <MetricCard
                icon="🚦"
                label="Kẹt xe trung bình"
                value={formatPercent(currentData.average_congestion_percent)}
              />
            </div>
          )}

          {/* Point cards */}
          {currentData?.has_data && (
            <div className={styles.pointCards}>
              <PointCard point={pointA} />
              <PointCard point={pointB} />
            </div>
          )}

          {/* Time Travel Control */}
          <TimeTravelControl
            mode={mode}
            actualCapturedAt={viewingAt}
            isLoading={isLoadingStatus}
            onViewAt={handleViewAt}
            onBackToLive={handleBackToLive}
          />

          {/* Congestion Chart */}
          <CongestionChart
            data={historyData}
            range={historyRange}
            onRangeChange={handleRangeChange}
            viewingAt={viewingAt}
            isLoading={isLoadingHistory}
          />

          {/* Collect button */}
          <div className={styles.collectSection}>
            <button
              id="btn-collect-now"
              className={styles.collectBtn}
              onClick={handleCollect}
              disabled={isCollecting}
            >
              {isCollecting ? "Đang thu thập..." : "🔄 Thu thập ngay"}
            </button>
            {collectMsg && (
              <span className={styles.collectMsg}>{collectMsg}</span>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
