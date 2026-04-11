import {
  Box,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

import { ErrorState } from "../../../shared/components/ErrorState";
import { Loading } from "../../../shared/components/Loading";
import styles from "./PredictCongestionPage.module.css";

import * as api from "../api/predictApi.mock";
import { usePredictStore } from "../state/usePredictStore";

import { AffectedTable4Cols } from "../components/AffectedTable4Cols";
import { MapPlaceholder } from "../components/MapPlaceholder";
import { SelectedSegmentMap } from "../components/SelectedSegmentMap";

export function PredictCongestionPage() {
  const { selectedSegmentId, setSelectedSegmentId } = usePredictStore();

  const segmentsQuery = useQuery({
    queryKey: ["predict", "segments"],
    queryFn: api.fetchSegments,
  });

  useEffect(() => {
    if (!selectedSegmentId && segmentsQuery.data?.length) {
      setSelectedSegmentId(segmentsQuery.data[0].id);
    }
  }, [selectedSegmentId, segmentsQuery.data, setSelectedSegmentId]);

  const selected = useMemo(() => {
    const segs = segmentsQuery.data || [];
    return segs.find((s) => s.id === selectedSegmentId) || null;
  }, [segmentsQuery.data, selectedSegmentId]);

  const affectedQuery = useQuery({
    enabled: Boolean(selectedSegmentId),
    queryKey: ["predict", "affected", selectedSegmentId],
    queryFn: () => api.fetchAffectedList(selectedSegmentId),
  });

  const spreadQuery = useQuery({
    enabled: Boolean(selectedSegmentId),
    queryKey: ["predict", "spread", selectedSegmentId],
    queryFn: () => api.fetchSpreadMapData(selectedSegmentId),
  });

  return (
    <Box>

      <Container maxWidth="lg" className={styles.section}>
        {/* Select */}
        <Box className={styles.selectWrap}>
          <FormControl size="small" fullWidth>
            <InputLabel>Select the road segment you want to predict</InputLabel>
            <Select
              label="Select the road segment you want to predict"
              value={selectedSegmentId}
              onChange={(e) => setSelectedSegmentId(e.target.value)}
            >
              {(segmentsQuery.data || []).map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {segmentsQuery.isLoading ? <Loading label="Loading segments..." /> : null}
          {segmentsQuery.error ? <ErrorState error={segmentsQuery.error} /> : null}
        </Box>

        {/* Map top */}
        <Box sx={{ mt: 2 }}>
          <SelectedSegmentMap selected={selected}/>
        </Box>

        {/* Table */}
        <Box sx={{ mt: 2 }}>
          {affectedQuery.isLoading ? <Loading label="Loading affected list..." /> : null}
          {affectedQuery.error ? <ErrorState error={affectedQuery.error} /> : null}
          {affectedQuery.data ? <AffectedTable4Cols items={affectedQuery.data.items} /> : null}
        </Box>

        {/* Spread map */}
        <Box sx={{ mt: 2 }}>
          <Typography className={styles.blockTitle}>
            Map predicting congestion spread:
          </Typography>

          {spreadQuery.isLoading ? <Loading label="Loading spread map..." /> : null}
          {spreadQuery.error ? <ErrorState error={spreadQuery.error} /> : null}

          <Box sx={{ mt: 1 }}>
            <MapPlaceholder
              label="Spread visualization overlay (rings/arrows)"
              height={420}
            />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}