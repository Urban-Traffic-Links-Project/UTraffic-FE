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
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { logoutFromServer } from "../api/authApi";
import { clearAuthData, getCurrentUser } from "../api/authStorage";

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

function AdminSidebar({ onNavigate, onLogout }) {
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

        <button className={styles.logoutButton} onClick={onLogout}>
          <LogoutRoundedIcon fontSize="small" />
          <span>Logout</span>
        </button>
      </Box>
    </Box>
  );
}

export function AdminLayout() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentUser = getCurrentUser();

  const closeMobileSidebar = () => {
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logoutFromServer();
    } catch (error) {
      console.error("ADMIN LOGOUT ERROR:", error);
    } finally {
      clearAuthData();
      navigate("/login", { replace: true });
    }
  };

  return (
    <Box className={styles.adminLayout}>
      {/* Desktop sidebar */}
      <aside className={styles.desktopSidebar}>
        <AdminSidebar onLogout={handleLogout} />
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
        <AdminSidebar onNavigate={closeMobileSidebar} onLogout={handleLogout} />
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
            <Box className={styles.avatar}>
              {(currentUser?.full_name || currentUser?.email || "A").charAt(0).toUpperCase()}
            </Box>
            <Box className={styles.userInfo}>
              <Typography className={styles.userName}>
                Welcome {currentUser?.full_name || "Admin"}
              </Typography>
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