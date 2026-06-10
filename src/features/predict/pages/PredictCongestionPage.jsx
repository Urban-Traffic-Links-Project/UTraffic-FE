import {
  Box,
  Card,
  CardContent,
  Container,
  Typography,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
  Divider,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState, useRef } from "react";

import { ErrorState } from "../../../shared/components/ErrorState";
import { Loading } from "../../../shared/components/Loading";
import styles from "./PredictCongestionPage.module.css";

import * as api from "../api/predictApi.http";
import { usePredictStore } from "../state/usePredictStore";

import { AffectedTable4Cols } from "../components/AffectedTable4Cols";
import { SelectedSegmentMap } from "../components/SelectedSegmentMap";
import * as apiIncidents from "../../incidents/api/incidentsApi.http";

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

function iconCategoryToColor(saCategory) {
  const cat = saCategory !== undefined && saCategory !== null ? Number(saCategory) : 6;
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

export function PredictCongestionPage() {
  const { selectedSegmentId, setSelectedSegmentId } = usePredictStore();
  const [horizon, setHorizon] = useState(1);
  const [mode, setMode] = useState("spread"); // "spread" or "cause"
  const [radius, setRadius] = useState(1.0);
  const [incidentsMode, setIncidentsMode] = useState("live"); // "live" | "history"
  
  const cardsContainerRef = useRef(null);

  // Tự động cuộn thẻ tương ứng vào giữa khung hình khi chọn sự cố
  useEffect(() => {
    if (selectedSegmentId && cardsContainerRef.current) {
      const cardEl = cardsContainerRef.current.querySelector(
        `[data-card-id="${selectedSegmentId}"]`
      );
      if (cardEl) {
        cardEl.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [selectedSegmentId]);

  // Mặc định bộ chọn datetime: 15 phút trước
  const [selectedDateTime, setSelectedDateTime] = useState(() => {
    const d = new Date(Date.now() - 15 * 60 * 1000);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  // Query 1: Các session lưu trữ gần đây (chỉ lấy trong mode history)
  const sessionsQuery = useQuery({
    queryKey: ["incidents", "sessions"],
    queryFn: () => apiIncidents.fetchIncidentSessions({ hours: 48 }),
    enabled: incidentsMode === "history",
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
    if (incidentsMode === "history" && sessionsList.length > 0) {
      const latestSession = sessionsList[0];
      if (latestSession && latestSession.sessionTimeLocal) {
        setSelectedDateTime(latestSession.sessionTimeLocal);
      }
    }
  }, [incidentsMode, sessionsList]);

  // Query 2: Sự cố Realtime (Live)
  const liveIncidentsQuery = useQuery({
    queryKey: ["incidents", "live"],
    queryFn: () => apiIncidents.fetchIncidents({ limit: 100 }),
     SaSAccepted: true,
    enabled: incidentsMode === "live",
    refetchInterval: incidentsMode === "live" ? 60_000 : false,
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
      apiIncidents.fetchIncidentHistory({ datetime: queryIsoString, limit: 120 }),
    enabled: incidentsMode === "history" && Boolean(queryIsoString),
  });

  // Gom nhóm dữ liệu incidents tùy theo chế độ đang chọn
  const incidents = useMemo(() => {
    if (incidentsMode === "live") {
      return liveIncidentsQuery.data?.incidents || [];
    } else {
      return historyIncidentsQuery.data?.incidents || [];
    }
  }, [incidentsMode, liveIncidentsQuery.data, historyIncidentsQuery.data]);

  const actualFetchedTime = useMemo(() => {
    if (incidentsMode === "live") {
      return incidents[0]?.fetched_at || null;
    } else {
      return historyIncidentsQuery.data?.actual_fetched_at || null;
    }
  }, [incidentsMode, incidents, historyIncidentsQuery.data]);

  const selected = useMemo(() => {
    if (!selectedSegmentId || !incidents) return null;
    const inc = incidents.find((s) => s.id === selectedSegmentId);
    if (!inc) return null;
    return {
      id: inc.id,
      name: inc.raw_properties?.from && inc.raw_properties?.to
        ? `${inc.raw_properties.from} → ${inc.raw_properties.to}`
        : inc.raw_properties?.from || inc.raw_properties?.to || "Sự cố",
      geometry: inc.geometry,
      icon_category: inc.icon_category,
    };
  }, [incidents, selectedSegmentId]);

  const isRoadClosed = selected?.icon_category === 8;

  const affectedQuery = useQuery({
    enabled: Boolean(selectedSegmentId) && !isRoadClosed,
    queryKey: ["predict", "affected", selectedSegmentId, horizon, mode, radius],
    queryFn: () => api.fetchAffectedSegments(selectedSegmentId, horizon, mode, radius),
  });

  const spreadQuery = useQuery({
    enabled: Boolean(selectedSegmentId) && !isRoadClosed,
    queryKey: ["predict", "spread", selectedSegmentId, horizon, mode, radius],
    queryFn: () => api.fetchSpreadMapData(selectedSegmentId, horizon, mode, radius),
  });

  const handleSessionChange = (event) => {
    const val = event.target.value;
    if (!val) return;
    setSelectedDateTime(val);
    setSelectedSegmentId(null);
  };

  const incidentsLoading = incidentsMode === "live" ? liveIncidentsQuery.isLoading : historyIncidentsQuery.isLoading;
  const incidentsError = incidentsMode === "live" ? liveIncidentsQuery.error : historyIncidentsQuery.error;

  return (
    <Box sx={{ bgcolor: "#fafafa", minHeight: "calc(100vh - 64px)", pb: 6 }}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        
        {/* Top Control Block: Selection Panel */}
        <Card variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.03)", maxWidth: "100%", overflow: "hidden" }}>
          {/* Header row with Mode Toggles */}
          <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 2 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: "#1a2530", mb: 0.5 }}>
                Dự báo Lan truyền kẹt xe 🚦
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Chọn sự cố giao thông (Trực tiếp hoặc Lịch sử) để dự đoán mức độ ảnh hưởng lan truyền
              </Typography>
            </Box>

            <ToggleButtonGroup
              value={incidentsMode}
              exclusive
              onChange={(e, val) => {
                if (val) {
                  setIncidentsMode(val);
                  setSelectedSegmentId(null); // Reset segment selection
                }
              }}
              size="small"
              sx={{
                bgcolor: "#fff",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                borderRadius: 2,
                "& .Mui-selected": {
                  bgcolor: incidentsMode === "live" ? "#ef4444 !important" : "#2563eb !important",
                  color: "#fff !important",
                  fontWeight: 700,
                },
              }}
            >
              <ToggleButton value="live" sx={{ px: 2.5, py: 0.75, textTransform: "none", fontWeight: 700 }}>
                🔴 Trực tiếp
              </ToggleButton>
              <ToggleButton value="history" sx={{ px: 2.5, py: 0.75, textTransform: "none", fontWeight: 700 }}>
                📅 Lịch sử
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* History Selection Row */}
          {incidentsMode === "history" && (
            <Grid container spacing={2} sx={{ mb: 2, p: 2, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #e2e8f0" }}>
              <Grid item xs={12} md={5}>
                <FormControl fullWidth size="small">
                  <InputLabel id="predict-session-label">Lịch sử thu thập tự động</InputLabel>
                  <Select
                    labelId="predict-session-label"
                    label="Lịch sử thu thập tự động"
                    value={selectedDateTime || ""}
                    onChange={handleSessionChange}
                    sx={{ borderRadius: 1.5 }}
                  >
                    {sessionsQuery.isLoading ? (
                      <MenuItem disabled>Đang tải danh sách lịch sử...</MenuItem>
                    ) : null}
                    {!sessionsQuery.isLoading && !sessionsList.length ? (
                      <MenuItem disabled>Không tìm thấy mẻ lưu trữ nào</MenuItem>
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
                  id="predict-history-datetime"
                  label="Hoặc chọn ngày giờ tùy ý"
                  type="datetime-local"
                  fullWidth
                  size="small"
                  value={selectedDateTime}
                  onChange={(e) => {
                    setSelectedDateTime(e.target.value);
                    setSelectedSegmentId(null);
                  }}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ max: new Date().toISOString().slice(0, 16) }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                {actualFetchedTime && (
                  <Box sx={{ bgcolor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 1.5, px: 2, py: 0.75 }}>
                    <Typography variant="caption" color="primary.main" sx={{ SaSAccepted: true, fontWeight: 700 }}>
                      📸 Snapshot thực tế:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#1e40af" }}>
                      {formatVN(actualFetchedTime)}
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          )}

          {/* Horizontal list of incidents */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#2d3748", mb: 1 }}>
              Danh sách sự cố ({incidents.length})
            </Typography>

            {incidentsLoading && <Loading label="Đang tải danh sách sự cố..." />}
            {incidentsError && <ErrorState error={incidentsError} />}

            {incidents.length === 0 && !incidentsLoading && !incidentsError ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                Không ghi nhận sự cố nào tại thời điểm này.
              </Typography>
            ) : null}

            {incidents.length > 0 ? (
              <Box
                ref={cardsContainerRef}
                sx={{
                  display: "flex",
                  overflowX: "auto",
                  gap: 2,
                  pb: 1.5,
                  width: "100%",
                  maxWidth: "100%",
                  minWidth: 0,
                  "&::-webkit-scrollbar": {
                    height: 8,
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "rgba(0,0,0,0.15)",
                    borderRadius: 4,
                  },
                }}
              >
                {incidents.map((inc) => {
                  const isSelected = selectedSegmentId === inc.id;
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
                      data-card-id={inc.id}
                      variant="outlined"
                      onClick={() => setSelectedSegmentId(isSelected ? null : inc.id)}
                      sx={{
                        minWidth: 340,
                        maxWidth: 400,
                        flexShrink: 0,
                        cursor: "pointer",
                        borderRadius: 2,
                        borderColor: isSelected ? color : "#e2e8f0",
                        borderLeft: `6px solid ${color}`,
                        boxShadow: isSelected ? `0 4px 12px ${color}22` : "0 1px 3px rgba(0,0,0,0.02)",
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          borderColor: color,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, mb: 1 }}>
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

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: "0.825rem", wordBreak: "break-word" }}>
                          📍 {location}
                        </Typography>

                        <Stack spacing={0.5}>
                          {inc.delay_seconds !== null && inc.delay_seconds > 0 && (
                            <Typography variant="caption" sx={{ fontWeight: 600, color: "#b91c1c" }}>
                              ⏱ Thời gian chậm: {formatDelay(inc.delay_seconds)}
                            </Typography>
                          )}
                          {inc.start_time && (
                            <Typography variant="caption" color="text.secondary">
                              🟢 Bắt đầu: {formatVN(inc.start_time)}
                            </Typography>
                          )}
                          {inc.end_time && (
                            <Typography variant="caption" color="text.secondary">
                              🔴 Kết thúc (Dự kiến): {formatVN(inc.end_time)}
                            </Typography>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            ) : null}
          </Box>
        </Card>

        {/* Bottom Section: Map, Controls, Table */}
        <Stack spacing={3}>
          {/* Map Block */}
          <Box>
            <SelectedSegmentMap
              selected={selected}
              incidents={incidents}
              affectedItems={isRoadClosed ? [] : (affectedQuery.data?.items || [])}
              arrows={isRoadClosed ? [] : (spreadQuery.data?.arrows || [])}
              origin={spreadQuery.data?.center}
              onSelect={setSelectedSegmentId}
            />
          </Box>

          {/* Controls panel or warning block */}
          {isRoadClosed ? (
            <Card
              saCategory="RoadClosed"
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "1px solid #fecaca",
                bgcolor: "#fef2f2",
                boxShadow: "0 2px 10px rgba(220, 38, 38, 0.05)",
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography sx={{ fontSize: "1.5rem" }}>⚠️</Typography>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#991b1b" }}>
                    Đoạn đường bị đóng nên không thể dự đoán
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 0.5, color: "#7f1d1d" }}>
                    Sự cố này thuộc loại Đóng đường (Road Closed). Việc dự đoán lan truyền hoặc tìm nguyên nhân ùn tắc không khả dụng cho các tuyến đường đã bị phong tỏa hoàn toàn.
                  </Typography>
                </Box>
              </Stack>
            </Card>
          ) : selectedSegmentId ? (
            <Card variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: "#f8f9fa" }}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: "#263238" }}>
                    Dự báo thời gian (Horizon: {horizon})
                  </Typography>
                  <Slider
                    value={horizon}
                    min={1}
                    max={9}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
                    onChange={(e, val) => setHorizon(val)}
                    sx={{
                      color: "#2ee36b",
                      "& .MuiSlider-thumb": {
                        backgroundColor: "#fff",
                        border: "2px solid currentColor",
                      }
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Horizon càng cao, dự báo càng xa về thời gian.
                  </Typography>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: "#263238" }}>
                    Phạm vi ảnh hưởng ({radius} km)
                  </Typography>
                  <Slider
                    value={radius}
                    min={0.5}
                    max={10}
                    step={0.5}
                    valueLabelDisplay="auto"
                    onChange={(e, val) => setRadius(val)}
                    sx={{
                      color: "#1976d2",
                      "& .MuiSlider-thumb": {
                        backgroundColor: "#fff",
                        border: "2px solid currentColor",
                      }
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Lọc các đoạn đường trong bán kính lựa chọn.
                  </Typography>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: "#263238" }}>
                    Chế độ phân tích
                  </Typography>
                  <ToggleButtonGroup
                    value={mode}
                    exclusive
                    onChange={(e, val) => val && setMode(val)}
                    size="small"
                    fullWidth
                    sx={{
                      "& .Mui-selected": {
                        bgcolor: "#2ee36b !important",
                        color: "#fff !important",
                        fontWeight: 700
                      }
                    }}
                  >
                    <ToggleButton value="spread">Lan truyền ảnh hưởng</ToggleButton>
                    <ToggleButton value="cause">Nguyên nhân gây ùn tắc</ToggleButton>
                  </ToggleButtonGroup>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    {mode === "spread"
                      ? "Xem các đoạn đường sẽ bị kẹt xe do sự cố này."
                      : "Xem đâu là nguồn gốc dẫn đến sự cố này."}
                  </Typography>
                </Grid>
              </Grid>
            </Card>
          ) : (
            <Card variant="outlined" sx={{ p: 3, borderRadius: 3, textAlign: "center", bgcolor: "#f8f9fa" }}>
              <Typography variant="body2" color="text.secondary">
                💡 Chọn một sự cố từ danh sách sự cố phía trên hoặc nhấp trực tiếp vào các sự cố trên bản đồ để bắt đầu phân tích và dự báo.
              </Typography>
            </Card>
          )}

          {/* Table */}
          {!isRoadClosed && selectedSegmentId && (
            <Box>
              {affectedQuery.isLoading ? <Loading label="Đang tải danh sách ảnh hưởng..." /> : null}
              {affectedQuery.error ? <ErrorState error={affectedQuery.error} /> : null}
              {affectedQuery.data ? <AffectedTable4Cols items={affectedQuery.data.items} /> : null}
            </Box>
          )}
        </Stack>
      </Container>
    </Box>
  );
}