import { Outlet, useLocation } from "react-router-dom";
import { Footer } from "./Footer";
import styles from "./MainLayout.module.css";
import { Topbar } from "./Topbar";

export function MainLayout() {
  const location = useLocation();
  const isTrafficDataPage = location.pathname === "/traffic-data";

  return (
    <div className={styles.layout}>
      <Topbar />

      <main className={isTrafficDataPage ? styles.mainFull : styles.mainNormal}>
        <Outlet />
      </main>

      {!isTrafficDataPage && <Footer />}
    </div>
  );
}