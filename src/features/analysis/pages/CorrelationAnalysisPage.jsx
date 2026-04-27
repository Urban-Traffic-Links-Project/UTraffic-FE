import {
  Autocomplete,
  Box,
  Container,
  TextField,
  Typography
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

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

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

export function CorrelationAnalysisPage() {
  const { selectedSegmentId, setSelectedSegmentId } = useCorrelationStore();
  const [segmentSearchText, setSegmentSearchText] = useState("");

  const segmentsQuery = useQuery({
    queryKey: ["corr", "segments"],
    queryFn: api.fetchSegments,
  });
  const segments = segmentsQuery.data || [];

  // set default selection
  useEffect(() => {
    if (!selectedSegmentId && segmentsQuery.data?.length) {
      setSelectedSegmentId(segmentsQuery.data[0].id);
    }
  }, [selectedSegmentId, segmentsQuery.data, setSelectedSegmentId]);

  const selected = useMemo(() => {
    return segments.find((s) => s.id === selectedSegmentId) || null;
  }, [segments, selectedSegmentId]);

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

  function handleSearchInputChange(_, value) {
    setSegmentSearchText(value);

    const keyword = normalizeText(value);

    if (!keyword) {
      return;
    }

    const exactMatch = segments.find(
      (s) => normalizeText(s.name) === keyword
    );

    const partialMatch = segments.find(
      (s) => normalizeText(s.name).includes(keyword)
    );

    const matchedSegment = exactMatch || partialMatch;

    if (matchedSegment && matchedSegment.id !== selectedSegmentId) {
      setSelectedSegmentId(matchedSegment.id);
    }
  }

  return (
    <Box>

      {/* EXECUTION SECTION */}
      <Container maxWidth="lg" className={styles.section}>

        <Box className={styles.execWrap}>
          {/* Select / search */}
          <Autocomplete
            fullWidth
            size="small"
            options={segments}
            value={selected}
            inputValue={segmentSearchText}
            loading={segmentsQuery.isLoading}
            getOptionLabel={(option) => option?.name || ""}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onInputChange={handleSearchInputChange}
            onChange={(_, value) => {
              if (value) {
                setSelectedSegmentId(value.id);
                setSegmentSearchText(value.name);
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Enter the name of the road segment to be analyzed."
                placeholder="Example: Nguyễn Huệ, Điện Biên Phủ..."
              />
            )}
          />

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