import { useMemo, useState } from "react";
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

const statisticalCards = [
  {
    id: 1,
    title: "Average Speed",
    value: "32.5 km/h",
    icon: <TimelineOutlinedIcon />,
    description: "Average traffic speed recorded across monitored road segments.",
  },
  {
    id: 2,
    title: "Congested Segments",
    value: "18",
    icon: <TrafficOutlinedIcon />,
    description: "Number of road segments currently experiencing congestion.",
  },
  {
    id: 3,
    title: "Correlation Score",
    value: "0.81",
    icon: <InsightsOutlinedIcon />,
    description: "Average correlation coefficient between connected road segments.",
  },
];

const trafficRows = [
  {
    id: 1,
    segment: "Cách Mạng Tháng 8",
    speed: "18 km/h",
    density: "High",
    status: "Congested",
  },
  {
    id: 2,
    segment: "Lý Chính Thắng",
    speed: "27 km/h",
    density: "Medium",
    status: "Moderate",
  },
  {
    id: 3,
    segment: "Võ Thị Sáu",
    speed: "35 km/h",
    density: "Low",
    status: "Stable",
  },
  {
    id: 4,
    segment: "Điện Biên Phủ",
    speed: "22 km/h",
    density: "High",
    status: "Congested",
  },
  {
    id: 5,
    segment: "Nguyễn Đình Chiểu",
    speed: "31 km/h",
    density: "Medium",
    status: "Moderate",
  },
];

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

export function TrafficDataPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarTheme, setSidebarTheme] = useState("dark");
  const [activeView, setActiveView] = useState("map");
  const [searchKeyword, setSearchKeyword] = useState("");

  const sidebarClassName = useMemo(() => {
    return [
      styles.sidebar,
      sidebarTheme === "dark" ? styles.sidebarDark : styles.sidebarLight,
      isSidebarCollapsed ? styles.sidebarCollapsed : "",
    ].join(" ");
  }, [sidebarTheme, isSidebarCollapsed]);

  return (
    <div className={`${styles.page} ${ isSidebarCollapsed ? styles.pageCollapsed : ""}`}>
      <aside className={sidebarClassName}>
        <div className={styles.sidebarTop}>
          <button
            className={styles.sidebarToggle}
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? (
              <ChevronRightOutlinedIcon />
            ) : (
              <ChevronLeftOutlinedIcon />
            )}
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
              {!isSidebarCollapsed && (
                <span className={styles.sidebarNavLabel}>{item.label}</span>
              )}
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
              <h2>Traffic Statistical Data</h2>
              <p>
                Overview of key traffic indicators collected from monitored road
                segments in Ho Chi Minh City.
              </p>
            </div>

            <div className={styles.statsCards}>
              {statisticalCards.map((card) => (
                <div className={styles.statCard} key={card.id}>
                  <div className={styles.statCardIcon}>{card.icon}</div>
                  <div className={styles.statCardContent}>
                    <h3>{card.title}</h3>
                    <strong>{card.value}</strong>
                    <p>{card.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.chartCard}>
                <div className={styles.blockHeader}>
                  <h3>Traffic distribution by period</h3>
                  <span>Today</span>
                </div>

                <div className={styles.barChart}>
                  <div className={styles.barItem}>
                    <span>06:00</span>
                    <div className={styles.barTrack}>
                      <div className={`${styles.barFill} ${styles.bar1}`} />
                    </div>
                  </div>
                  <div className={styles.barItem}>
                    <span>09:00</span>
                    <div className={styles.barTrack}>
                      <div className={`${styles.barFill} ${styles.bar2}`} />
                    </div>
                  </div>
                  <div className={styles.barItem}>
                    <span>12:00</span>
                    <div className={styles.barTrack}>
                      <div className={`${styles.barFill} ${styles.bar3}`} />
                    </div>
                  </div>
                  <div className={styles.barItem}>
                    <span>15:00</span>
                    <div className={styles.barTrack}>
                      <div className={`${styles.barFill} ${styles.bar4}`} />
                    </div>
                  </div>
                  <div className={styles.barItem}>
                    <span>18:00</span>
                    <div className={styles.barTrack}>
                      <div className={`${styles.barFill} ${styles.bar5}`} />
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.tableCard}>
                <div className={styles.blockHeader}>
                  <h3>Observed road segments</h3>
                  <span>Live sample</span>
                </div>

                <div className={styles.tableWrapper}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Road Segment</th>
                        <th>Speed</th>
                        <th>Density</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trafficRows.map((row) => (
                        <tr key={row.id}>
                          <td>{row.segment}</td>
                          <td>{row.speed}</td>
                          <td>{row.density}</td>
                          <td>
                            <span
                              className={`${styles.statusBadge} ${
                                row.status === "Congested"
                                  ? styles.statusDanger
                                  : row.status === "Moderate"
                                  ? styles.statusWarning
                                  : styles.statusSuccess
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
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