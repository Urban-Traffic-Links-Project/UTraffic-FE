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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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

async function readJsonSafely(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getApiErrorMessage(data, fallbackMessage) {
  if (typeof data?.detail === "string") return data.detail;
  if (Array.isArray(data?.detail) && data.detail[0]?.msg) return data.detail[0].msg;
  if (typeof data?.message === "string") return data.message;

  return fallbackMessage;
}

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

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState("request-code");
  const [forgotEmail, setForgotEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  const canSubmit = useMemo(() => {
    if (!email.trim()) return false;
    if (pw.length < 1) return false;
    if (loading) return false;
    return true;
  }, [email, pw, loading]);

  const canSendResetCode = useMemo(() => {
    if (forgotLoading) return false;
    return /\S+@\S+\.\S+/.test(forgotEmail.trim());
  }, [forgotEmail, forgotLoading]);

  const canResetPassword = useMemo(() => {
    if (forgotLoading) return false;
    if (!/\S+@\S+\.\S+/.test(forgotEmail.trim())) return false;
    if (verificationCode.trim().length < 4) return false;
    if (newPassword.length < 6) return false;
    if (newPassword !== confirmPassword) return false;
    return true;
  }, [forgotEmail, forgotLoading, verificationCode, newPassword, confirmPassword]);

  const resetForgotState = () => {
    setForgotStep("request-code");
    setForgotEmail(email.trim());
    setVerificationCode("");
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setForgotLoading(false);
    setForgotError("");
    setForgotSuccess("");
  };

  const handleOpenForgot = () => {
    resetForgotState();
    setForgotOpen(true);
  };

  const handleCloseForgot = () => {
    if (forgotLoading) return;
    setForgotOpen(false);
  };

  const handleSendResetCode = async (e) => {
    e.preventDefault();

    setForgotError("");
    setForgotSuccess("");

    if (!canSendResetCode) return;

    try {
      setForgotLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/forgot-password/send-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: forgotEmail.trim(),
        }),
      });

      const data = await readJsonSafely(response);

      if (response.ok) {
        setForgotStep("reset-password");
        setForgotSuccess("Mã xác thực đã được gửi đến email. Vui lòng kiểm tra hộp thư.");
        return;
      }

      setForgotError(
        getApiErrorMessage(data, "Không thể gửi mã xác thực. Vui lòng thử lại.")
      );
    } catch (error) {
      console.error("SEND RESET CODE ERROR:", error);
      setForgotError("Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend/API URL.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setForgotError("");
    setForgotSuccess("");

    if (!canResetPassword) {
      if (newPassword !== confirmPassword) {
        setForgotError("Mật khẩu xác nhận không khớp.");
      }
      return;
    }

    try {
      setForgotLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/forgot-password/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          code: verificationCode.trim(),
          new_password: newPassword,
        }),
      });

      const data = await readJsonSafely(response);

      if (response.ok) {
        setForgotStep("done");
        setPw("");
        setForgotSuccess("Đổi mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.");
        return;
      }

      setForgotError(
        getApiErrorMessage(data, "Không thể đổi mật khẩu. Vui lòng kiểm tra lại mã xác thực.")
      );
    } catch (error) {
      console.error("RESET PASSWORD ERROR:", error);
      setForgotError("Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend/API URL.");
    } finally {
      setForgotLoading(false);
    }
  };

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

      const data = await readJsonSafely(response);

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
                    onClick={handleOpenForgot}
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

      <Dialog open={forgotOpen} onClose={handleCloseForgot} fullWidth maxWidth="xs">
        <DialogTitle className={styles.forgotDialogTitle}>
          {forgotStep === "done" ? "Password updated" : "Forgot Password"}
        </DialogTitle>

        <DialogContent className={styles.forgotDialogContent}>
          {forgotError && <Alert severity="error">{forgotError}</Alert>}
          {forgotSuccess && <Alert severity="success">{forgotSuccess}</Alert>}

          {forgotStep === "request-code" && (
            <Box component="form" onSubmit={handleSendResetCode} className={styles.forgotForm}>
              <Typography className={styles.forgotDescription}>
                Nhập email tài khoản. Hệ thống sẽ gửi mã xác thực để đặt lại mật khẩu.
              </Typography>

              <TextField
                fullWidth
                label="Email"
                placeholder="Enter your Email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                type="email"
                autoFocus
              />

              <Button
                type="submit"
                fullWidth
                disabled={!canSendResetCode}
                className={styles.submitBtn}
              >
                {forgotLoading ? <CircularProgress size={24} color="inherit" /> : "Send verification code"}
              </Button>
            </Box>
          )}

          {forgotStep === "reset-password" && (
            <Box component="form" onSubmit={handleResetPassword} className={styles.forgotForm}>
              <Typography className={styles.forgotDescription}>
                Nhập mã xác thực đã nhận qua email và mật khẩu mới.
              </Typography>

              <TextField
                fullWidth
                label="Verification code"
                placeholder="Enter code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                inputProps={{ maxLength: 6 }}
                autoFocus
              />

              <TextField
                fullWidth
                label="New password"
                placeholder="Enter new password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                helperText="Mật khẩu tối thiểu 6 ký tự."
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowNewPassword((s) => !s)} edge="end">
                        {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Confirm password"
                placeholder="Confirm new password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={Boolean(confirmPassword) && newPassword !== confirmPassword}
                helperText={
                  Boolean(confirmPassword) && newPassword !== confirmPassword
                    ? "Mật khẩu xác nhận không khớp."
                    : " "
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword((s) => !s)} edge="end">
                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                disabled={!canResetPassword}
                className={styles.submitBtn}
              >
                {forgotLoading ? <CircularProgress size={24} color="inherit" /> : "Reset password"}
              </Button>

              <Button
                type="button"
                fullWidth
                disabled={forgotLoading || !canSendResetCode}
                onClick={handleSendResetCode}
                className={styles.secondaryBtn}
              >
                Resend code
              </Button>
            </Box>
          )}

          {forgotStep === "done" && (
            <Typography className={styles.forgotDescription}>
              Mật khẩu đã được cập nhật. Đóng cửa sổ này và đăng nhập lại bằng mật khẩu mới.
            </Typography>
          )}
        </DialogContent>

        <DialogActions className={styles.forgotDialogActions}>
          {forgotStep === "reset-password" && (
            <Button
              disabled={forgotLoading}
              onClick={() => {
                setForgotStep("request-code");
                setForgotError("");
                setForgotSuccess("");
              }}
            >
              Back
            </Button>
          )}
          <Button disabled={forgotLoading} onClick={handleCloseForgot}>
            {forgotStep === "done" ? "Close" : "Cancel"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
