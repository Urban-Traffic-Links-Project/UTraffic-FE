import { Alert } from "@mui/material";

export function ErrorState({ error, title = "Something went wrong" }) {
  const msg = typeof error === "string" ? error : error?.message || "Unknown error";
  return <Alert severity="error">{title}: {msg}</Alert>;
}
