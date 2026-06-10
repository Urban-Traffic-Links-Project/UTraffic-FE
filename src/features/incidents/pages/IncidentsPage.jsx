import { useEffect, useMemo, useState, useRef } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { ErrorState } from "../../../shared/components/ErrorState";
import { Loading } from "../../../shared/components/Loading";
import { IncidentsMap } from "../ui/IncidentsMap";
import * as api from "../api/incidentsApi.http";

const ICON_CATEGORY_LABELS = {
  0: "Không rõ",
  1: "Tai nạn",
  2: "Sương mù",
  3: "Điều kiện nguy hiểm",
  4: "Mưa lớn",
  5: "Đóng băng",
  6: "Kẹt xe / Ùn tắc",
  7: "Làn đường bị chặn",
  8: "Đóng đường",
  9: "Công trình thi công",
  10: "Gió lớn",
  11: "Ngập lụt",
  14: "Xe hư hỏng",
};

const MAGNITUDE_LABELS = {
  0: "Không trễ",
  1: "Trễ nhẹ",
  2: "Trễ trung bình",
  3: "Trễ nặng",
  4: "Kẹt cứng",
};

function iconCategoryToColor(iconCategory) {
  const cat = Number(iconCategory);
  if (cat === 8) return "#6d28d9"; // RoadClosed -> Purple
  if (cat === 7) return "#7c2d12"; // LaneClosed -> Dark Orange
  if (cat === 9) return "#2563eb"; // RoadWorks -> Blue
  if (cat === 1) return "#ef4444"; // Accident -> Red
  if (cat === 6) return "#b91c1c"; // Jam -> Dark Red
  if (cat === 11) return "#0288d1"; // Flooding -> Blue
  return "#f59e0b"; // other -> Amber
}

function formatVN(isoString) {
  if (!isoString) return "--";
  try {
    return new Date(isoString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh",
    });
  } catch {
    return "--";
  }
}

function formatDelay(seconds) {
  if (seconds == null) return "--";
  const s = Math.round(Number(seconds));
  if (s < 60) return `${s} giây`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m} phút ${rem} giây` : `${m} phút`;
}

function formatDateTimeLocal(dateOrStr) {
  if (!dateOrStr) return "";
  const d = new Date(dateOrStr);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function IncidentsPage() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState("live"); // "live" | "history"
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [isFetchingNow, setIsFetchingNow] = useState(false);

  const listContainerRef = useRef(null);

  // Tự động cuộn thẻ tương ứng vào giữa khung hình khi chọn sự cố
  useEffect(() => {
    if (selectedIncidentId && listContainerRef.current) {
      const cardEl = listContainerRef.current.querySelector(
        `[data-incident-id="${selectedIncidentId}"]`
      );
      if (cardEl) {
        cardEl.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [selectedIncidentId]);

  // Mặc định bộ chọn datetime: 15 phút trước
  const [selectedDateTime, setSelectedDateTime] = useState(() => {
    const d = new Date(Date.now() - 15 * 60 * 1000);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  // Query 1: Các session lưu trữ gần đây (chỉ lấy trong mode history)
  const sessionsQuery = useQuery({
    queryKey: ["incidents", "sessions"],
    queryFn: () => api.fetchIncidentSessions({ hours: 48 }),
    enabled: mode === "history",
  });

  const sessionsList = useMemo(() => {
    const raw = sessionsQuery.data?.sessions || [];
    return raw.map((s) => ({
      ...s,
      sessionTimeLocal: formatDateTimeLocal(s.session_time),
    }));
  }, [sessionsQuery.data]);

  // Tự động set selectedDateTime sang session mới nhất khi đổi sang mode history
  useEffect(() => {
    if (mode === "history" && sessionsList.length > 0) {
      const latestSession = sessionsList[0];
      if (latestSession && latestSession.sessionTimeLocal) {
        setSelectedDateTime(latestSession.sessionTimeLocal);
      }
    }
  }, [mode, sessionsList]);

  // Query 2: Sự cố Realtime (Live)
  const liveIncidentsQuery = useQuery({
    queryKey: ["incidents", "live"],
    queryFn: () => api.fetchIncidents({ limit: 100 }),
    enabled: mode === "live",
    refetchInterval: mode === "live" ? 60_000 : false,
  });

  // Chuyển datetime local sang ISO string để gửi API
  const queryIsoString = useMemo(() => {
    if (!selectedDateTime) return null;
    try {
      return new Date(selectedDateTime).toISOString();
    } catch {
      return null;
    }
  }, [selectedDateTime]);

  // Query 3: Sự cố Lịch sử theo ngày giờ chọn
  const historyIncidentsQuery = useQuery({
    queryKey: ["incidents", "history", queryIsoString],
    queryFn: () =>
      api.fetchIncidentHistory({ datetime: queryIsoString, limit: 120 }),
    enabled: mode === "history" && Boolean(queryIsoString),
  });

  // Gom nhóm dữ liệu incidents tùy theo chế độ đang chọn
  const incidents = useMemo(() => {
    if (mode === "live") {
      return liveIncidentsQuery.data?.incidents || [];
    } else {
      return historyIncidentsQuery.data?.incidents || [];
    }
  }, [mode, liveIncidentsQuery.data, historyIncidentsQuery.data]);

  // Sự cố đang chọn để focus trên bản đồ
  const selectedIncident = useMemo(() => {
    if (!selectedIncidentId) return null;
    return incidents.find((inc) => inc.id === selectedIncidentId) || null;
  }, [incidents, selectedIncidentId]);

  // Handler khi bấm "Fetch now" thủ công trong chế độ Live
  async function handleFetchNow() {
    setIsFetchingNow(true);
    try {
      await api.fetchAndSaveIncidents();
      await queryClient.invalidateQueries({ queryKey: ["incidents", "live"] });
      setSelectedIncidentId(null);
    } catch (err) {
      console.error("Fetch incidents failed:", err);
    } finally {
      setIsFetchingNow(false);
    }
  }

  // Handler khi chọn một session có sẵn
  const handleSessionChange = (event) => {
    const val = event.target.value;
    if (!val) return;
    setSelectedDateTime(val);
    setSelectedIncidentId(null);
  };

  const isLoading = mode === "live" ? liveIncidentsQuery.isLoading : historyIncidentsQuery.isLoading;
  const isError = mode === "live" ? liveIncidentsQuery.isError : historyIncidentsQuery.isError;
  const errorObj = mode === "live" ? liveIncidentsQuery.error : historyIncidentsQuery.error;

  const actualFetchedTime = mode === "live"
    ? (incidents[0]?.fetched_at || null)
    : (historyIncidentsQuery.data?.actual_fetched_at || null);

  return (
    <Box sx={{ bgcolor: "#fafafa", minHeight: "calc(100vh - 64px)", pb: 6 }}>
      <Container maxWidth="xl" sx={{ pt: 4, pb: 6 }}>
        {/* Tiêu đề & Chế độ Live/History */}
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 4 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: "#1a2530", mb: 0.5 }}>
              Giám sát Sự cố Giao thông (TomTom)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Lưu trữ và theo dõi các điểm kẹt xe, tai nạn thời gian thực & lịch sử
            </Typography>
          </Box>

          <Stack direction="row" spacing={2} alignItems="center">
            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(e, val) => {
                if (val) {
                  setMode(val);
                  setSelectedIncidentId(null);
                }
              }}
              size="small"
              sx={{
                bgcolor: "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                borderRadius: 2,
                "& .Mui-selected": {
                  bgcolor: mode === "live" ? "#ef4444 !important" : "#2563eb !important",
                  color: "#fff !important",
                  fontWeight: 700,
                },
              }}
            >
              <ToggleButton value="live" sx={{ px: 2, textTransform: "none" }}>
                🔴 Trực tiếp
              </ToggleButton>
              <ToggleButton value="history" sx={{ px: 2, textTransform: "none" }}>
                📅 Lịch sử
              </ToggleButton>
            </ToggleButtonGroup>

            {mode === "live" ? (
              <Button
                variant="contained"
                onClick={handleFetchNow}
                disabled={isLoading || isFetchingNow}
                sx={{
                  bgcolor: "#25323A",
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700,
                  "&:hover": { bgcolor: "#1f2930" },
                }}
              >
                {isFetchingNow ? "Đang cập nhật..." : "Cập nhật ngay"}
              </Button>
            ) : null}
          </Stack>
        </Box>

        {/* Bảng điều khiển Lịch sử */}
        {mode === "history" && (
          <Card variant="outlined" sx={{ mb: 3, borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={5}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="session-select-label">Lịch sử thu thập tự động</InputLabel>
                    <Select
                      labelId="session-select-label"
                      label="Lịch sử thu thập tự động"
                      value={selectedDateTime || ""}
                      onChange={handleSessionChange}
                      sx={{ borderRadius: 2 }}
                    >
                      {sessionsQuery.isLoading ? (
                        <MenuItem disabled>Đang tải danh sách lịch sử...</MenuItem>
                      ) : null}
                      {!sessionsQuery.isLoading && !sessionsList.length ? (
                        <MenuItem disabled>Không tìm thấy dữ liệu lưu trữ nào</MenuItem>
                      ) : null}
                      {sessionsList.map((s, idx) => (
                        <MenuItem key={idx} value={s.sessionTimeLocal}>
                          ⏰ {formatVN(s.session_time)} — ({s.incident_count} sự cố)
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    id="history-datetime-picker"
                    label="Hoặc chọn ngày giờ tùy ý"
                    type="datetime-local"
                    fullWidth
                    size="small"
                    value={selectedDateTime}
                    onChange={(e) => {
                      setSelectedDateTime(e.target.value);
                      setSelectedIncidentId(null);
                    }}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ max: new Date().toISOString().slice(0, 16) }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  {actualFetchedTime && (
                    <Box sx={{ bgcolor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 2, px: 2, py: 1 }}>
                      <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700 }}>
                        📸 Snapshot thực tế lúc:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#1e40af" }}>
                        {formatVN(actualFetchedTime)}
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Trạng thái Loading / Error */}
        {isLoading && <Loading label="Đang tải dữ liệu sự cố..." />}
        {isError && errorObj && <ErrorState error={errorObj} />}

        {/* Bố cục chính Grid: Bản đồ & Danh sách sự cố */}
        <Grid container spacing={3}>
          {/* Bản đồ bên trái */}
          <Grid item xs={12} lg={8}>
            <Card variant="outlined" sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid #e2e8f0" }}>
              <IncidentsMap
                incidents={incidents}
                selectedIncident={selectedIncident}
                onSelectIncident={(id) => setSelectedIncidentId(id)}
                getColor={(inc) => iconCategoryToColor(inc.icon_category)}
              />
            </Card>
          </Grid>

          {/* Danh sách sự cố bên phải */}
          <Grid item xs={12} lg={4}>
            <Card variant="outlined" sx={{ borderRadius: 3, height: 550, display: "flex", flexDirection: "column" }}>
              <Box sx={{ p: 2, borderBottom: "1px solid #e2e8f0" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#2d3748" }}>
                  Danh sách sự cố ({incidents.length})
                </Typography>
                {actualFetchedTime && mode === "live" && (
                  <Typography variant="caption" color="text.secondary">
                    Cập nhật lần cuối: {formatVN(actualFetchedTime)}
                  </Typography>
                )}
              </Box>

              <Box
                ref={listContainerRef}
                sx={{ flex: 1, overflowY: "auto", p: 2, bgcolor: "#fcfcfc" }}
              >
                {!isLoading && incidents.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 8 }}>
                    <Typography variant="body2" color="text.secondary">
                      Không có sự cố nào được ghi nhận tại thời điểm này.
                    </Typography>
                  </Box>
                ) : null}

                <Stack spacing={1.5}>
                  {incidents.map((inc) => {
                    const isSelected = selectedIncidentId === inc.id;
                    const props = inc.raw_properties || {};
                    const fromStreet = props.from || "";
                    const toStreet = props.to || "";
                    const location =
                      fromStreet && toStreet
                        ? `${fromStreet} → ${toStreet}`
                        : fromStreet || toStreet || "Không rõ đường";

                    const color = iconCategoryToColor(inc.icon_category);

                    return (
                      <Card
                        key={inc.id}
                        data-incident-id={inc.id}
                        variant="outlined"
                        onClick={() =>
                          setSelectedIncidentId(isSelected ? null : inc.id)
                        }
                        sx={{
                          cursor: "pointer",
                          borderColor: isSelected ? color : "#e2e8f0",
                          borderLeft: `5px solid ${color}`,
                          boxShadow: isSelected
                            ? `0 4px 12px ${color}22`
                            : "none",
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            borderColor: color,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                          },
                        }}
                      >
                        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1a252c" }}>
                              {inc.icon_category_label ||
                                ICON_CATEGORY_LABELS[inc.icon_category] ||
                                `Sự cố nhóm ${inc.icon_category}`}
                            </Typography>
                            {inc.magnitude_of_delay !== null && (
                              <Typography
                                variant="caption"
                                sx={{
                                  bgcolor: inc.magnitude_of_delay >= 3 ? "#fee2e2" : "#fef3c7",
                                  color: inc.magnitude_of_delay >= 3 ? "#b91c1c" : "#b45309",
                                  fontWeight: 700,
                                  px: 1,
                                  py: 0.25,
                                  borderRadius: 1,
                                }}
                              >
                                {MAGNITUDE_LABELS[inc.magnitude_of_delay] || "Kẹt xe"}
                              </Typography>
                            )}
                          </Box>

                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: "0.825rem", wordBreak: "break-word" }}>
                            📍 {location}
                          </Typography>

                          <Stack spacing={0.5}>
                            {inc.delay_seconds !== null && inc.delay_seconds > 0 && (
                              <Typography variant="caption" display="block" color="error.main" sx={{ fontWeight: 600 }}>
                                ⏱ Thời gian chậm: {formatDelay(inc.delay_seconds)}
                              </Typography>
                            )}
                            {inc.start_time && (
                              <Typography variant="caption" display="block" color="text.secondary">
                                🟢 Bắt đầu: {new Date(inc.start_time).toLocaleString("vi-VN")}
                              </Typography>
                            )}
                            {inc.end_time && (
                              <Typography variant="caption" display="block" color="text.secondary">
                                🔴 Kết thúc (Dự kiến): {new Date(inc.end_time).toLocaleString("vi-VN")}
                              </Typography>
                            )}
                            {inc.matched_edges?.length > 0 && (
                              <Typography variant="caption" display="block" color="success.main" sx={{ fontWeight: 600 }}>
                                🛣 Đã khớp: {inc.matched_edges.length} đoạn đường
                              </Typography>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Stack>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}


