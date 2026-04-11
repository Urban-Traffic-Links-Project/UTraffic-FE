import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Container,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link as MuiLink,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PATHS } from "../../../app/router/paths";
import loginIllustration from '../../../assets/Home2.png';
import styles from "./LoginPage.module.css";

function IllustrationPlaceholder() {
  return (
    <Box className={styles.illusWrap}>
      <Box className={styles.illusPh}>
        <Box
          component="img"
          src={loginIllustration}
          alt="Login Illustration"
          sx={{
            width: '100%',
            height: 'auto',
            maxWidth: '500px', // Giới hạn kích thước nếu cần
          }}
        />
      </Box>
    </Box>
  );
}

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const canSubmit = useMemo(() => email.trim() && pw.length >= 1, [email, pw]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: connect backend later
    console.log("LOGIN", { email, pw, remember });
  };

  return (
    <Box className={styles.page}>
      <Container maxWidth="lg">
        <Box className={styles.grid}>
          {/* LEFT: form */}
          <Card className={styles.card} elevation={0}>
            <CardContent className={styles.cardContent}>
              <Typography className={styles.welcome}>Welcome!</Typography>

              <Typography className={styles.title}>Login to HCMTraffic</Typography>

              <Box component="form" onSubmit={handleSubmit} className={styles.form}>
                <Typography className={styles.label}>Email</Typography>
                <TextField
                  fullWidth
                  placeholder="Enter your Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  Login
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

          {/* RIGHT: illustration */}
          <IllustrationPlaceholder />
        </Box>
      </Container>
    </Box>
  );
}