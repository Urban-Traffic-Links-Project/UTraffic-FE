import {
  Box,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

import { ErrorState } from "../../../shared/components/ErrorState";
import { Loading } from "../../../shared/components/Loading";
import styles from "./CorrelationAnalysisPage.module.css";

import * as api from "../api/correlationApi.mock";
import { useCorrelationStore } from "../state/useCorrelationStore";

import { AffectedSegmentsTable } from "../components/Correlation/AffectedSegmentsTable";
import { CorrelationMatrixPlaceholder } from "../components/Correlation/CorrelationMatrixPlaceholder";
import { SelectedSegmentMap } from "../components/Correlation/SelectedSegmentMap";

function ImagePlaceholder({ label }) {
  return (
    <Box className={styles.imgPh}>
      <Typography variant="caption" className={styles.imgPhText}>
        {label}
      </Typography>
    </Box>
  );
}

export function CorrelationAnalysisPage() {
  const { selectedSegmentId, setSelectedSegmentId } = useCorrelationStore();

  const segmentsQuery = useQuery({
    queryKey: ["corr", "segments"],
    queryFn: api.fetchSegments,
  });

  // set default selection
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
    queryKey: ["corr", "affected", selectedSegmentId],
    queryFn: () => api.fetchAffectedSegments(selectedSegmentId),
  });

  const matrixQuery = useQuery({
    enabled: Boolean(selectedSegmentId),
    queryKey: ["corr", "matrix", selectedSegmentId],
    queryFn: () => api.fetchCorrelationMatrix(selectedSegmentId),
  });

  return (
    <Box>

      {/* EXECUTION SECTION */}
      <Container maxWidth="lg" className={styles.section}>
        <Typography className={styles.execTitle}>Analysis execution section</Typography>

        <Box className={styles.execWrap}>
          {/* Select / search */}
          <FormControl size="small" fullWidth>
            <InputLabel>Select the road segment you want to analyze</InputLabel>
            <Select
              label="Select the road segment you want to analyze"
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

          <Box sx={{ mt: 2 }}>
            {segmentsQuery.isLoading ? <Loading label="Loading segments..." /> : null}
            {segmentsQuery.error ? <ErrorState error={segmentsQuery.error} /> : null}
          </Box>

          {/* Map */}
          <Box sx={{ mt: 2 }}>
            <SelectedSegmentMap selected={selected} />
          </Box>

          {/* Affected segments table */}
          <Box sx={{ mt: 3 }}>
            {affectedQuery.isLoading ? <Loading label="Loading affected segments..." /> : null}
            {affectedQuery.error ? <ErrorState error={affectedQuery.error} /> : null}
            {affectedQuery.data ? (
              <AffectedSegmentsTable items={affectedQuery.data.items} />
            ) : null}
          </Box>

          {/* Correlation matrix */}
          <Box className={styles.matrixWrap}>
            {matrixQuery.isLoading ? <Loading label="Running analysis / building matrix..." /> : null}
            {matrixQuery.error ? <ErrorState error={matrixQuery.error} /> : null}
            {matrixQuery.data ? (
              <CorrelationMatrixPlaceholder matrix={matrixQuery.data} />
            ) : null}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}