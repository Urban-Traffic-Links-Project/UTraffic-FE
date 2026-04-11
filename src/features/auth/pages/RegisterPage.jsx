import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import registerIllustration from '../../../assets/Home3.png';
import styles from "./RegisterPage.module.css";

function IllustrationPlaceholder() {
  return (
    <Box className={styles.illusWrap}>
      <Box className={styles.illusPh}>
        <Box
            component="img"
            src={registerIllustration}
            alt="Register Illustration"
            sx={{
              width: '100%',
              height: 'auto',
              maxWidth: '480px', // Giới hạn kích thước nếu cần
            }}
          />
      </Box>
    </Box>
  );
}

export function RegisterPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [cpw, setCpw] = useState("");

  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);

  const canSubmit = useMemo(() => {
    if (!email.trim()) return false;
    if (pw.length < 6) return false;
    if (pw !== cpw) return false;
    return true;
  }, [email, pw, cpw]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: connect backend later
    console.log("REGISTER", { email, pw, cpw });
  };

  return (
    <Box className={styles.page}>
      <Container maxWidth="lg">
        <Box className={styles.grid}>
          {/* LEFT: Form card */}
          <Card className={styles.card} elevation={0}>
            <CardContent className={styles.cardContent}>
              <Typography className={styles.welcome}>Welcome!</Typography>

              <Typography className={styles.title}>Sign up to HCMTraffic</Typography>

              <Box component="form" onSubmit={handleSubmit} className={styles.form}>
                <Typography className={styles.label}>Email</Typography>
                <TextField
                  fullWidth
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  size="medium"
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
                        <IconButton onClick={() => setShowCpw((s) => !s)} edge="end">
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
                  Register
                </Button>

                {/* Hint / validation (optional) */}
                <Typography className={styles.hint}>
                  {pw && pw.length < 6 ? "Password should be at least 6 characters." : ""}
                  {pw && cpw && pw !== cpw ? " Passwords do not match." : ""}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* RIGHT: Illustration */}
          <IllustrationPlaceholder />
        </Box>
      </Container>
    </Box>
  );
}