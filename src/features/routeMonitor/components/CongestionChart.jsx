/**
 * src/features/routeMonitor/components/CongestionChart.jsx
 * Biểu đồ lịch sử congestion % theo thời gian cho 2 điểm A và B.
 * Dùng recharts.
 */

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import styles from "./CongestionChart.module.css";

const RANGE_OPTIONS = [
  { label: "1h", value: 1 },
  { label: "6h", value: 6 },
  { label: "24h", value: 24 },
  { label: "7 ngày", value: 168 },
];

function formatTime(isoString, hours) {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    if (hours <= 6) {
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Ho_Chi_Minh",
      });
    }
    if (hours <= 24) {
      return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Ho_Chi_Minh",
      });
    }
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh",
    });
  } catch {
    return isoString;
  }
}

function formatViewingAt(isoString) {
  if (!isoString) return null;
  try {
    return new Date(isoString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh",
    });
  } catch {
    return null;
  }
}

/** Merge snapshots của cả 2 điểm theo thời gian */
function mergeChartData(historyData, hours) {
  const byTime = {};

  for (const snap of historyData) {
    const key = snap.captured_at;
    if (!byTime[key]) {
      byTime[key] = { captured_at: key, displayTime: formatTime(key, hours) };
    }
    if (snap.point_label === "A") {
      byTime[key].congestionA = snap.congestion_percent ?? null;
      byTime[key].speedA = snap.current_speed ?? null;
    } else if (snap.point_label === "B") {
      byTime[key].congestionB = snap.congestion_percent ?? null;
      byTime[key].speedB = snap.current_speed ?? null;
    }
  }

  return Object.values(byTime).sort(
    (a, b) => new Date(a.captured_at) - new Date(b.captured_at)
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipTime}>{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className={styles.tooltipRow}>
          <span className={styles.tooltipDot} style={{ background: entry.color }} />
          <span>{entry.name}: </span>
          <strong>
            {entry.value != null ? `${entry.value.toFixed(1)}%` : "Không có"}
          </strong>
        </div>
      ))}
    </div>
  );
};

/**
 * @param {Object} props
 * @param {Array} props.data - danh sách snapshots từ API
 * @param {number} props.range - số giờ hiện tại (1|6|24|168)
 * @param {Function} props.onRangeChange - callback(hours)
 * @param {string|null} props.viewingAt - ISO string của snapshot đang xem (time-travel)
 * @param {boolean} props.isLoading
 */
export function CongestionChart({
  data = [],
  range = 24,
  onRangeChange,
  viewingAt = null,
  isLoading = false,
}) {
  const chartData = mergeChartData(data, range);
  const viewingAtLabel = formatViewingAt(viewingAt);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>📈 Lịch sử kẹt xe</h3>
        <div className={styles.rangeSelector}>
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              id={`btn-range-${opt.value}h`}
              className={`${styles.rangeBtn} ${range === opt.value ? styles.rangeBtnActive : ""}`}
              onClick={() => onRangeChange?.(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className={styles.loading}>Đang tải dữ liệu...</div>
      ) : chartData.length === 0 ? (
        <div className={styles.empty}>
          <span>📭</span>
          <p>Chưa có dữ liệu trong khoảng thời gian này</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
            <XAxis
              dataKey="displayTime"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={{ stroke: "rgba(148,163,184,0.2)" }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "12px", color: "#94a3b8", paddingTop: "8px" }}
            />

            {/* Reference line tại thời điểm đang xem */}
            {viewingAt && (
              <ReferenceLine
                x={formatTime(viewingAt, range)}
                stroke="#fbbf24"
                strokeWidth={2}
                strokeDasharray="6 3"
                label={{
                  value: viewingAtLabel || "",
                  position: "top",
                  fill: "#fbbf24",
                  fontSize: 10,
                }}
              />
            )}

            <Line
              type="monotone"
              dataKey="congestionA"
              name="Điểm A"
              stroke="#6366f1"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="congestionB"
              name="Điểm B"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
