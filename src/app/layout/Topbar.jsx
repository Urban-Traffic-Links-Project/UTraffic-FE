import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import {
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Toolbar,
} from "@mui/material";
import { useState } from "react";
import { NavLink } from "react-router-dom";

import logo from "../../assets/logo.png";
import styles from "./Topbar.module.css";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Traffic Data", to: "/traffic-data" },
  { label: "Correlation Analysis", to: "/analysis" },
  { label: "Predict Congestion", to: "/predict" },
];

export function Topbar() {
  const [open, setOpen] = useState(false);

  const closeMenu = () => {
    setOpen(false);
  };

  return (
    <>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: "#25323A" }}>
        <Toolbar className={styles.toolbar}>
          {/* Logo */}
          <NavLink to="/" className={styles.brand}>
            <img src={logo} alt="Logo" className={styles.logo} />
            <div className={styles.brandText}>HCMTraffic</div>
          </NavLink>

          {/* Desktop nav */}
          <nav className={styles.nav}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.active : ""}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className={styles.actions}>
            <Button
              component={NavLink}
              to="/login"
              variant="contained"
              disableElevation
              sx={{
                bgcolor: "white",
                color: "#2E7D32",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 2,
                px: 2.5,
                "&:hover": { bgcolor: "rgba(255,255,255,0.9)" },
              }}
            >
              Login
            </Button>

            <Button
              component={NavLink}
              to="/signup"
              variant="contained"
              disableElevation
              sx={{
                bgcolor: "#2E7D32",
                color: "white",
                fontWeight: 800,
                textTransform: "none",
                borderRadius: 2,
                px: 2.5,
                "&:hover": { bgcolor: "#256628" },
              }}
            >
              Sign up
            </Button>
          </div>

          {/* Mobile menu button */}
          <IconButton
            className={styles.mobileMenuButton}
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <MenuRoundedIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={closeMenu}
        PaperProps={{
          className: styles.drawerPaper,
        }}
      >
        <Box className={styles.drawerHeader}>
          <Box className={styles.drawerBrand}>
            <img src={logo} alt="Logo" className={styles.drawerLogo} />
            <div className={styles.drawerBrandText}>HCMTraffic</div>
          </Box>

          <IconButton onClick={closeMenu} aria-label="Close menu">
            <CloseRoundedIcon />
          </IconButton>
        </Box>

        <Divider />

        <Box className={styles.drawerNav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeMenu}
              className={({ isActive }) =>
                `${styles.drawerNavItem} ${isActive ? styles.drawerActive : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </Box>

        <Divider />

        <Box className={styles.drawerActions}>
          <Button
            component={NavLink}
            to="/login"
            onClick={closeMenu}
            variant="outlined"
            fullWidth
            sx={{
              color: "#2E7D32",
              borderColor: "#2E7D32",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: 2,
            }}
          >
            Login
          </Button>

          <Button
            component={NavLink}
            to="/signup"
            onClick={closeMenu}
            variant="contained"
            fullWidth
            disableElevation
            sx={{
              bgcolor: "#2E7D32",
              color: "white",
              fontWeight: 800,
              textTransform: "none",
              borderRadius: 2,
              "&:hover": { bgcolor: "#256628" },
            }}
          >
            Sign up
          </Button>
        </Box>
      </Drawer>
    </>
  );
}