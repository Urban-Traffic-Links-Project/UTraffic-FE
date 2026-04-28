import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { logoutFromServer } from "../../app/api/authApi";
import { clearAuthData, getAccessToken, getCurrentUser } from "../../app/api/authStorage";
import { getMe } from "../../app/api/userApi";
import logo from "../../assets/logo.png";
import styles from "./Topbar.module.css";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Traffic Data", to: "/traffic-data" },
  { label: "Correlation Analysis", to: "/analysis" },
  { label: "Predict Congestion", to: "/predict" },
];

function isAdminUser(user) {
  const role = String(user?.role || "").trim().toLowerCase();

  return role === "admin" || role === "administrator";
}

export function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const isUserMenuOpen = Boolean(anchorEl);

  useEffect(() => {
    let ignore = false;

    const loadCurrentUser = async () => {
      const accessToken = getAccessToken();

      if (!accessToken) {
        setUser(null);
        return;
      }

      const cachedUser = getCurrentUser();

      if (cachedUser) {
        setUser(cachedUser);
      }

      try {
        const freshUser = await getMe();

        if (!ignore) {
          setUser(freshUser);
        }
      } catch (error) {
        console.error("GET ME ERROR:", error);

        if (!ignore) {
          setUser(null);
        }
      }
    };

    loadCurrentUser();

    return () => {
      ignore = true;
    };
  }, [location.pathname]);

  const closeMenu = () => {
    setOpen(false);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    try {
      setLoggingOut(true);
      await logoutFromServer();
    } catch (error) {
      console.error("LOGOUT ERROR:", error);
    } finally {
      clearAuthData();
      setUser(null);
      setAnchorEl(null);
      setOpen(false);
      setLoggingOut(false);
      navigate("/login");
    }
  };

  const isLoggedIn = Boolean(user);
  const isAdmin = isAdminUser(user);

  const handleGoToAdmin = () => {
    setAnchorEl(null);
    setOpen(false);
    navigate("/admin");
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
            {!isLoggedIn ? (
              <>
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
              </>
            ) : (
              <>
                <IconButton
                  onClick={handleOpenUserMenu}
                  className={styles.userButton}
                  aria-label="User menu"
                >
                  <Avatar className={styles.userAvatar}>
                    <AccountCircleRoundedIcon />
                  </Avatar>
                </IconButton>

                <Menu
                  anchorEl={anchorEl}
                  open={isUserMenuOpen}
                  onClose={handleCloseUserMenu}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                >
                  <Box className={styles.userMenuHeader}>
                    <Typography className={styles.userName}>
                      {user.full_name || "User"}
                    </Typography>
                    <Typography className={styles.userEmail}>
                      {user.email}
                    </Typography>
                  </Box>

                  <Divider />

                  {isAdmin && (
                    <MenuItem onClick={handleGoToAdmin}>
                      <ListItemIcon>
                        <AdminPanelSettingsRoundedIcon fontSize="small" />
                      </ListItemIcon>
                      Về trang quản lí
                    </MenuItem>
                  )}

                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <LogoutRoundedIcon fontSize="small" />
                    </ListItemIcon>
                    Logout
                  </MenuItem>
                </Menu>
              </>
            )}
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
          {!isLoggedIn ? (
            <>
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
            </>
          ) : (
            <Box className={styles.drawerUserBox}>
              <Box className={styles.drawerUserInfo}>
                <Avatar className={styles.drawerUserAvatar}>
                  <AccountCircleRoundedIcon />
                </Avatar>

                <Box>
                  <Typography className={styles.drawerUserName}>
                    {user.full_name || "User"}
                  </Typography>
                  <Typography className={styles.drawerUserEmail}>
                    {user.email}
                  </Typography>
                </Box>
              </Box>

              {isAdmin && (
                <Button
                  onClick={handleGoToAdmin}
                  variant="outlined"
                  fullWidth
                  startIcon={<AdminPanelSettingsRoundedIcon />}
                  sx={{
                    color: "#2E7D32",
                    borderColor: "#2E7D32",
                    fontWeight: 800,
                    textTransform: "none",
                    borderRadius: 2,
                  }}
                >
                  Về trang quản lí
                </Button>
              )}

              <Button
                onClick={handleLogout}
                disabled={loggingOut}
                variant="contained"
                fullWidth
                disableElevation
                startIcon={<LogoutRoundedIcon />}
                sx={{
                  bgcolor: "#2E7D32",
                  color: "white",
                  fontWeight: 800,
                  textTransform: "none",
                  borderRadius: 2,
                  "&:hover": { bgcolor: "#256628" },
                }}
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>
    </>
  );
}