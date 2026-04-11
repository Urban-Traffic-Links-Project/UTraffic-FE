import { AppBar, Button, Toolbar } from "@mui/material";
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
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{ bgcolor: "#25323A" }}
    >
      <Toolbar className={styles.toolbar}>
        {/* Logo */}
        <div className={styles.brand}>
          <img src={logo} alt="Logo" className={styles.logo} />
          <div className={styles.brandText}>HCMTraffic</div>
        </div>

        {/* Nav */}
        <div className={styles.nav}>
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
        </div>

        {/* Login and sign up */}
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
      </Toolbar>
    </AppBar>
  );
}