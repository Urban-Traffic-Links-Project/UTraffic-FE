import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import {
  Box,
  Drawer,
  IconButton,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

import logo from "../../assets/logo.png";
import styles from "./AdminLayout.module.css";

const adminNavItems = [
  {
    label: "Account management",
    to: "/admin/accounts",
    icon: <ManageAccountsRoundedIcon fontSize="small" />,
  },
  {
    label: "System settings",
    to: "/admin/settings",
    icon: <SettingsRoundedIcon fontSize="small" />,
  },
];

function AdminSidebar({ onNavigate }) {
  return (
    <Box className={styles.sidebarInner}>
      <NavLink to="/" className={styles.brand} onClick={onNavigate}>
        <img src={logo} alt="Logo" className={styles.logo} />
        <Box>
          <Typography className={styles.brandName}>HCMTraffic</Typography>
          <Typography className={styles.brandSub}>Admin Panel</Typography>
        </Box>
      </NavLink>

      <Box className={styles.navList}>
        {adminNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
            }
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </Box>

      <Box className={styles.sidebarFooter}>
        <NavLink to="/" className={styles.backToSite} onClick={onNavigate}>
          Back to Analysis Interface
        </NavLink>

        <button className={styles.logoutButton}>
          <LogoutRoundedIcon fontSize="small" />
          <span>Logout</span>
        </button>
      </Box>
    </Box>
  );
}

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobileSidebar = () => {
    setMobileOpen(false);
  };

  return (
    <Box className={styles.adminLayout}>
      {/* Desktop sidebar */}
      <aside className={styles.desktopSidebar}>
        <AdminSidebar />
      </aside>

      {/* Mobile drawer */}
      <Drawer
        open={mobileOpen}
        onClose={closeMobileSidebar}
        anchor="left"
        PaperProps={{
          className: styles.mobileDrawerPaper,
        }}
      >
        <AdminSidebar onNavigate={closeMobileSidebar} />
      </Drawer>

      <Box className={styles.mainArea}>
        <header className={styles.adminTopbar}>
          <IconButton
            className={styles.menuButton}
            onClick={() => setMobileOpen(true)}
            aria-label="Open admin menu"
          >
            <MenuRoundedIcon />
          </IconButton>

          <Box>
            <Typography className={styles.topbarTitle}>
              Admin Area
            </Typography>
          </Box>

          <Box className={styles.userBox}>
            <Box className={styles.avatar}>A</Box>
            <Box className={styles.userInfo}>
              <Typography className={styles.userName}>Admin</Typography>
              <Typography className={styles.userRole}>Administrator</Typography>
            </Box>
          </Box>
        </header>

        <main className={styles.content}>
          <Outlet />
        </main>
      </Box>
    </Box>
  );
}