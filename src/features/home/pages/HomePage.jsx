import { useNavigate } from "react-router-dom";
import styles from "./HomePage.module.css";

import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import TrafficOutlinedIcon from "@mui/icons-material/TrafficOutlined";
import heroImage from "../../../assets/Home.png";

const functionCards = [
  {
    id: 1,
    icon: <BarChartOutlinedIcon />,
    title: "Traffic Data Statistics",
    description:
      "Provide traffic data statistics and visual insights to support the monitoring and evaluation of traffic conditions in Ho Chi Minh City.",
  },
  {
    id: 2,
    icon: <TimelineOutlinedIcon />,
    title: "Traffic Correlation Analysis",
    description:
      "Analyze the correlations between traffic states of road segments within the urban transportation network to better understand their interactions.",
  },
  {
    id: 3,
    icon: <TrafficOutlinedIcon />,
    title: "Congestion Prediction",
    description:
      "Predict traffic congestion trends based on historical and real-time data to support appropriate decision-making and traffic management solutions.",
  },
];

export function HomePage() {
  const navigate = useNavigate();
  return (
    <div className={styles.homepage}>
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <div className={styles.heroText}>
              <h1>
                Applying data
                <br />
                analysis methods
                <br />
                to analyze and
                <br />
                predict traffic
                <br />
                conditions.
              </h1>

              <p>
                This website was developed as part of a research project aimed
                at analyzing traffic conditions and the relationships between
                road segments within the urban transportation network. The
                system focuses on exploiting real-world data, analyzing
                correlations, and simulating congestion propagation to support
                the proposal of appropriate solutions for Ho Chi Minh City.
              </p>

              <button className={styles.primaryBtn}>Register</button>
            </div>

            <div className={styles.heroImageWrap}>
              <img
                src={heroImage}
                alt="Traffic analysis illustration"
                className={styles.heroImage}
              />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.functionsSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeading}>
            <h2>Main functions of the system</h2>
            <p>What is UTraffic used for?</p>
          </div>

          <div className={styles.functionsGrid}>
            {functionCards.map((item) => (
              <div className={styles.functionCard} key={item.id}>
                <div className={styles.functionIcon}>{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <h2>
              Please feel free to explore
              <br />
              the features our system offers.
            </h2>
            <button className={styles.primaryBtn} onClick={() => navigate("/traffic-data")}>
              Try out
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}