import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import registerIllustration from "../../../assets/Home3.png";
import styles from "./RegisterPage.module.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function IllustrationPlaceholder() {
  return (
    <Box className={styles.illusWrap}>
      <Box className={styles.illusPh}>
        <Box
          component="img"
          src={registerIllustration}
          alt="Register Illustration"
          sx={{
            width: "100%",
            height: "auto",
            maxWidth: "480px",
          }}
        />
      </Box>
    </Box>
  );
}

export function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [cpw, setCpw] = useState("");

  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const canSubmit = useMemo(() => {
    if (!fullName.trim()) return false;
    if (!email.trim()) return false;
    if (pw.length < 6) return false;
    if (pw !== cpw) return false;
    if (loading) return false;
    return true;
  }, [fullName, email, pw, cpw, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMsg("");
    setSuccessMsg("");

    if (!canSubmit) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: pw,
          full_name: fullName.trim(),
        }),
      });

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (response.status === 201) {
        setSuccessMsg("Đăng ký tài khoản thành công.");

        // Nếu muốn chuyển sang trang login sau khi đăng ký:
        // navigate("/login");

        console.log("REGISTER SUCCESS:", data);
        return;
      }

      if (response.status === 409) {
        setErrorMsg("Email đã tồn tại. Vui lòng dùng email khác.");
        return;
      }

      if (response.status === 422) {
        const firstError = data?.detail?.[0]?.msg;
        setErrorMsg(firstError || "Dữ liệu đăng ký không hợp lệ.");
        return;
      }

      setErrorMsg(data?.detail || "Đăng ký thất bại. Vui lòng thử lại.");
    } catch (error) {
      console.error("REGISTER ERROR:", error);
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
              <Typography className={styles.title}>
                Sign up to HCMTraffic
              </Typography>

              <Box component="form" onSubmit={handleSubmit} className={styles.form}>
                {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
                {successMsg && <Alert severity="success">{successMsg}</Alert>}

                <Typography className={styles.label}>Full name</Typography>
                <TextField
                  fullWidth
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  size="medium"
                />

                <Typography className={styles.label}>Email</Typography>
                <TextField
                  fullWidth
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  size="medium"
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
                        <IconButton
                          onClick={() => setShowPw((s) => !s)}
                          edge="end"
                        >
                          {showPw ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Typography className={styles.label}>Confirm Password</Typography>
                <TextField
                  fullWidth
                  placeholder="Confirm your Password"
                  type={showCpw ? "text" : "password"}
                  value={cpw}
                  onChange={(e) => setCpw(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowCpw((s) => !s)}
                          edge="end"
                        >
                          {showCpw ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  disabled={!canSubmit}
                  className={styles.submitBtn}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Register"
                  )}
                </Button>

                <Typography className={styles.hint}>
                  {pw && pw.length < 6
                    ? "Password should be at least 6 characters."
                    : ""}
                  {pw && cpw && pw !== cpw ? " Passwords do not match." : ""}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <IllustrationPlaceholder />
        </Box>
      </Container>
    </Box>
  );
}