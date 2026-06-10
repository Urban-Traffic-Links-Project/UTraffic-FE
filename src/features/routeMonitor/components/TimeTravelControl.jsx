/**
 * src/features/routeMonitor/components/TimeTravelControl.jsx
 * Bảng điều khiển chọn ngày giờ để xem lại dữ liệu lịch sử.
 */

import { useState } from "react";
import styles from "./TimeTravelControl.module.css";

function formatVN(isoString) {
  if (!isoString) return "--";
  try {
    return new Date(isoString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh",
    });
  } catch {
    return isoString;
  }
}

/** Lấy datetime-local string mặc định (1 giờ trước) */
function getDefaultDatetimeLocal() {
  const now = new Date();
  now.setHours(now.getHours() - 1);
  // Format: YYYY-MM-DDTHH:MM
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/**
 * @param {Object} props
 * @param {"live"|"history"} props.mode
 * @param {string|null} props.actualCapturedAt - ISO string của snapshot thực tế đang xem
 * @param {boolean} props.isLoading
 * @param {Function} props.onViewAt - callback(isoString)
 * @param {Function} props.onBackToLive - callback()
 */
export function TimeTravelControl({
  mode,
  actualCapturedAt,
  isLoading,
  onViewAt,
  onBackToLive,
}) {
  const [datetimeLocal, setDatetimeLocal] = useState(getDefaultDatetimeLocal);

  const handleSubmit = () => {
    if (!datetimeLocal) return;
    // Chuyển từ local time sang ISO string có timezone
    const dt = new Date(datetimeLocal);
    // Thêm offset +07:00 (Vietnam)
    const isoWithTZ = dt.toISOString();
    onViewAt(isoWithTZ);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.icon}>⏱</span>
        <span className={styles.title}>Chế độ xem</span>
      </div>

      {/* Toggle buttons */}
      <div className={styles.toggleRow}>
        <button
          id="btn-live-mode"
          className={`${styles.toggleBtn} ${mode === "live" ? styles.toggleBtnActive : ""}`}
          onClick={onBackToLive}
          disabled={mode === "live"}
        >
          🔴 Trực tiếp
        </button>
        <button
          id="btn-history-mode"
          className={`${styles.toggleBtn} ${mode === "history" ? styles.toggleBtnActiveHistory : ""}`}
          onClick={() => {
            if (mode !== "history") handleSubmit();
          }}
          disabled={mode === "history"}
        >
          📅 Lịch sử
        </button>
      </div>

      {/* Datetime picker — luôn hiển thị */}
      <div className={styles.pickerGroup}>
        <label className={styles.label} htmlFor="route-datetime-picker">
          Chọn ngày giờ muốn xem:
        </label>
        <input
          id="route-datetime-picker"
          type="datetime-local"
          className={styles.dateInput}
          value={datetimeLocal}
          onChange={(e) => setDatetimeLocal(e.target.value)}
          max={new Date().toISOString().slice(0, 16)}
        />
        <button
          id="btn-view-at-time"
          className={styles.viewBtn}
          onClick={handleSubmit}
          disabled={isLoading || !datetimeLocal}
        >
          {isLoading ? "Đang tải..." : "Xem tại thời điểm này →"}
        </button>
      </div>

      {/* Thông tin snapshot đang xem */}
      {mode === "history" && actualCapturedAt && (
        <div className={styles.viewingAtBox}>
          <span className={styles.viewingAtIcon}>📸</span>
          <div>
            <div className={styles.viewingAtLabel}>Đang xem dữ liệu lúc:</div>
            <div className={styles.viewingAtTime}>{formatVN(actualCapturedAt)}</div>
          </div>
        </div>
      )}

      {/* Nút quay về live */}
      {mode === "history" && (
        <button
          id="btn-back-to-live"
          className={styles.backBtn}
          onClick={onBackToLive}
        >
          ← Quay về trực tiếp
        </button>
      )}
    </div>
  );
}
