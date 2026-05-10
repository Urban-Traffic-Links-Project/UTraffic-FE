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
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { ErrorState } from "../../../shared/components/ErrorState";
import { Loading } from "../../../shared/components/Loading";
import styles from "./PredictCongestionPage.module.css";

import * as api from "../api/predictApi.http";
import { usePredictStore } from "../state/usePredictStore";

import { AffectedTable4Cols } from "../components/AffectedTable4Cols";
import { SelectedSegmentMap } from "../components/SelectedSegmentMap";
import { fetchIncidents } from "../../incidents/api/incidentsApi.http";



export function PredictCongestionPage() {
  const { selectedSegmentId, setSelectedSegmentId } = usePredictStore();
  const [horizon, setHorizon] = useState(1);
  const [mode, setMode] = useState("spread"); // "spread" or "cause"
  const [radius, setRadius] = useState(3.0);


  const incidentsQuery = useQuery({
    queryKey: ["incidents", "predict-overlay"],
    queryFn: () => fetchIncidents({ limit: 80 }),
    refetchInterval: 60_000,
  });

  const selected = useMemo(() => {
    if (!selectedSegmentId || !incidentsQuery.data?.incidents) return null;
    const inc = incidentsQuery.data.incidents.find((s) => s.id === selectedSegmentId);
    if (!inc) return null;
    return {
      id: inc.id,
      name: inc.raw_properties?.from && inc.raw_properties?.to 
          ? `${inc.raw_properties.from} → ${inc.raw_properties.to}` 
          : "Sự cố",
      geometry: inc.geometry,
    };
  }, [incidentsQuery.data, selectedSegmentId]);

  const affectedQuery = useQuery({
    enabled: Boolean(selectedSegmentId),
    queryKey: ["predict", "affected", selectedSegmentId, horizon, mode, radius],
    queryFn: () => api.fetchAffectedSegments(selectedSegmentId, horizon, mode, radius),
  });

  const spreadQuery = useQuery({
    enabled: Boolean(selectedSegmentId),
    queryKey: ["predict", "spread", selectedSegmentId, horizon, mode, radius],
    queryFn: () => api.fetchSpreadMapData(selectedSegmentId, horizon, mode, radius),
  });



  const latestIncidents = useMemo(() => {
    const items = incidentsQuery.data?.incidents || [];
    return items.slice(0, 20);
  }, [incidentsQuery.data]);



  return (
    <Box>

      <Container maxWidth="lg" className={styles.section}>
        {/* Latest incidents */}
        <Box sx={{ mb: 2 }}>
          <Typography
            className={styles.blockTitle}
            variant="h5"
            sx={{
              fontWeight: 900,
              textTransform: 'none',
              letterSpacing: '-0.5px'
            }}
          >
            Sự cố mới nhất
          </Typography>

          {incidentsQuery.isLoading ? <Loading label="Đang tải sự cố..." /> : null}
          {incidentsQuery.error ? <ErrorState error={incidentsQuery.error} /> : null}

          {!incidentsQuery.isLoading && !latestIncidents.length ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Chưa có dữ liệu sự cố nào.
            </Typography>
          ) : null}

          {latestIncidents.length ? (
            <Box
              sx={{
                mt: 1,
                display: "flex",
                overflowX: "auto",
                gap: 2,
                pb: 1, // for scrollbar
                "&::-webkit-scrollbar": {
                  height: 6,
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "rgba(0,0,0,0.2)",
                  borderRadius: 3,
                },
              }}
            >
              {latestIncidents.map((inc) => {
                const props = inc.raw_properties || {};
                const fromStreet = props.from || "";
                const toStreet = props.to || "";
                const location = fromStreet && toStreet ? `${fromStreet} → ${toStreet}` : (fromStreet || toStreet || "Không rõ đường");

                const cat = Number(inc.icon_category);
                const color = 
                  cat === 1 ? "#d32f2f" : // Accident -> Red
                  cat === 6 ? "#f57c00" : // Jam -> Orange
                  cat === 8 ? "#7b1fa2" : // RoadClosed -> Purple
                  cat === 9 ? "#1976d2" : // RoadWorks -> Blue
                  "#757575";             // Default -> Grey

                return (
                  <Card
                    key={inc.id}
                    variant="outlined"
                    onClick={() => setSelectedSegmentId(inc.id)}
                    sx={{
                      minWidth: 260,
                      flexShrink: 0,
                      borderRadius: 2,
                      boxShadow: selectedSegmentId === inc.id ? `0 4px 12px ${color}66` : "0 2px 8px rgba(0,0,0,0.04)",
                      borderColor: selectedSegmentId === inc.id ? color : undefined,
                      borderLeft: `6px solid ${color}`,
                      cursor: "pointer",
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                         borderColor: color,
                      }
                    }}
                  >
                    <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {inc.icon_category_label || `Loại sự cố ${inc.icon_category ?? "Không xác định"}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {location}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Cập nhật: {new Date(inc.fetched_at).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          ) : null}
        </Box>

        {/* Controls */}
        <Card variant="outlined" sx={{ mt: 3, p: 2, borderRadius: 3, bgcolor: "#f8f9fa" }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} divider={<Divider orientation="vertical" flexItem />}>
            <Box sx={{ flex: 1 }}>
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
            </Box>

            <Box sx={{ flex: 1 }}>
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
            </Box>

            <Box sx={{ flex: 1 }}>
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
                  ? "Xem các đoạn đường sẽ bị kết xe do sự cố này."
                  : "Xem đâu là nguồn gốc dẫn đến sự cố này."}
              </Typography>
            </Box>
          </Stack>
        </Card>

        {/* Map top */}
        <Box sx={{ mt: 2 }}>
          <SelectedSegmentMap 
            selected={selected} 
            incidents={incidentsQuery.data?.incidents || []} 
            affectedItems={affectedQuery.data?.items || []}
            arrows={spreadQuery.data?.arrows || []}
            origin={spreadQuery.data?.center}
            onSelect={setSelectedSegmentId}
          />
        </Box>

        {/* Table */}
        <Box sx={{ mt: 2 }}>
          {affectedQuery.isLoading ? <Loading label="Đang tải danh sách ảnh hưởng..." /> : null}
          {affectedQuery.error ? <ErrorState error={affectedQuery.error} /> : null}
          {affectedQuery.data ? <AffectedTable4Cols items={affectedQuery.data.items} /> : null}
        </Box>


      </Container>
    </Box>
  );
}