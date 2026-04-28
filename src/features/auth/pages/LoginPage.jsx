import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Container,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link as MuiLink,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { saveAuthData } from "../../../app/api/authStorage";
import { PATHS } from "../../../app/router/paths";
import loginIllustration from "../../../assets/Home2.png";
import styles from "./LoginPage.module.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function IllustrationPlaceholder() {
  return (
    <Box className={styles.illusWrap}>
      <Box className={styles.illusPh}>
        <Box
          component="img"
          src={loginIllustration}
          alt="Login Illustration"
          sx={{
            width: "100%",
            height: "auto",
            maxWidth: "500px",
          }}
        />
      </Box>
    </Box>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const canSubmit = useMemo(() => {
    if (!email.trim()) return false;
    if (pw.length < 1) return false;
    if (loading) return false;
    return true;
  }, [email, pw, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMsg("");

    if (!canSubmit) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: pw,
        }),
      });

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (response.status === 200) {
        saveAuthData({
          user: data.user,
          tokens: data.tokens,
          remember,
        });

        const role = String(data?.user?.role || "").trim().toLowerCase();
        const isAdmin = role === "admin" || role === "administrator";

        if (from) {
          navigate(from, { replace: true });
        } else if (isAdmin) {
          navigate(PATHS.admin, { replace: true });
        } else {
          navigate(PATHS.home, { replace: true });
        }

        return;
      }

      if (response.status === 401) {
        setErrorMsg("Email hoặc mật khẩu không đúng.");
        return;
      }

      if (response.status === 422) {
        const firstError = data?.detail?.[0]?.msg;
        setErrorMsg(firstError || "Dữ liệu đăng nhập không hợp lệ.");
        return;
      }

      setErrorMsg(data?.detail || "Đăng nhập thất bại. Vui lòng thử lại.");
    } catch (error) {
      console.error("LOGIN ERROR:", error);
      setErrorMsg("Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend/API URL.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className={styles.page}>
      <Container maxWidth="lg">
        <Box className={styles.grid}>
          <Card className={styles.card} elevation={0}>
            <CardContent className={styles.cardContent}>
              <Typography className={styles.title}>Login to HCMTraffic</Typography>

              <Box component="form" onSubmit={handleSubmit} className={styles.form}>
                {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

                <Typography className={styles.label}>Email</Typography>
                <TextField
                  fullWidth
                  placeholder="Enter your Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                />

                <Typography className={styles.label}>Password</Typography>
                <TextField
                  fullWidth
                  placeholder="Enter your Password"
                  type={showPw ? "text" : "password"}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPw((s) => !s)} edge="end">
                          {showPw ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box className={styles.row}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                      />
                    }
                    label={<Typography className={styles.remember}>Remember me</Typography>}
                  />

                  <MuiLink
                    component="button"
                    type="button"
                    className={styles.forgot}
                    onClick={() => console.log("TODO: forgot password")}
                  >
                    Forgot Password ?
                  </MuiLink>
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  disabled={!canSubmit}
                  className={styles.submitBtn}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : "Login"}
                </Button>

                <Box className={styles.bottom}>
                  <Typography className={styles.bottomText}>
                    Don&apos;t have an Account ?{" "}
                    <MuiLink component={Link} to={PATHS.signup} className={styles.registerLink}>
                      Register
                    </MuiLink>
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <IllustrationPlaceholder />
        </Box>
      </Container>
    </Box>
  );
}