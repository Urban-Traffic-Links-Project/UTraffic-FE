import InstagramIcon from "@mui/icons-material/Instagram";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import SportsBasketballIcon from "@mui/icons-material/SportsBasketball";
import TwitterIcon from "@mui/icons-material/Twitter";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { Box, Container, IconButton, InputBase, Typography } from "@mui/material";

import logo from "../../assets/logo.png";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <Box component="footer" className={styles.footer}>
      <Container maxWidth="lg" className={styles.container}>
        <Box className={styles.grid}>
          {/* Left */}
          <Box className={styles.leftCol}>
            <Box className={styles.brand}>
              <img src={logo} alt="Logo" className={styles.logo} />

              <Typography className={styles.brandText}>UTraffic</Typography>
            </Box>

            <Typography className={styles.muted}>
              Copyright © 2020 UTraffic ltd.
            </Typography>
            <Typography className={styles.muted}>All rights reserved</Typography>

            <Box className={styles.socialRow}>
              <IconButton className={styles.socialBtn} aria-label="Instagram">
                <InstagramIcon fontSize="small" />
              </IconButton>
              <IconButton className={styles.socialBtn} aria-label="Dribbble">
                <SportsBasketballIcon fontSize="small" />
              </IconButton>
              <IconButton className={styles.socialBtn} aria-label="Twitter">
                <TwitterIcon fontSize="small" />
              </IconButton>
              <IconButton className={styles.socialBtn} aria-label="YouTube">
                <YouTubeIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Company */}
          <Box className={styles.col}>
            <Typography className={styles.colTitle}>Company</Typography>
            <Box className={styles.links}>
              <a className={styles.link} href="#">About us</a>
              <a className={styles.link} href="#">Blog</a>
              <a className={styles.link} href="#">Contact us</a>
              <a className={styles.link} href="#">Pricing</a>
              <a className={styles.link} href="#">Testimonials</a>
            </Box>
          </Box>

          {/* Support */}
          <Box className={styles.col}>
            <Typography className={styles.colTitle}>Support</Typography>
            <Box className={styles.links}>
              <a className={styles.link} href="#">Help center</a>
              <a className={styles.link} href="#">Terms of service</a>
              <a className={styles.link} href="#">Legal</a>
              <a className={styles.link} href="#">Privacy policy</a>
              <a className={styles.link} href="#">Status</a>
            </Box>
          </Box>

          {/* Stay up to date */}
          <Box className={styles.col}>
            <Typography className={styles.colTitle}>Stay up to date</Typography>

            <Box className={styles.emailBox}>
              <InputBase
                className={styles.emailInput}
                placeholder="Your email address"
                inputProps={{ "aria-label": "your email address" }}
              />
              <IconButton className={styles.sendBtn} aria-label="send">
                <SendRoundedIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}