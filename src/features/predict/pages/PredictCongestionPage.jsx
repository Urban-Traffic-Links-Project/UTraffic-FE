import {
  Autocomplete,
  Box,
  Container,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { ErrorState } from "../../../shared/components/ErrorState";
import { Loading } from "../../../shared/components/Loading";
import styles from "./PredictCongestionPage.module.css";

import * as api from "../api/predictApi.mock";
import { usePredictStore } from "../state/usePredictStore";

import { AffectedTable4Cols } from "../components/AffectedTable4Cols";
import { MapPlaceholder } from "../components/MapPlaceholder";
import { SelectedSegmentMap } from "../components/SelectedSegmentMap";

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

export function PredictCongestionPage() {
  const { selectedSegmentId, setSelectedSegmentId } = usePredictStore();
  const [segmentSearchText, setSegmentSearchText] = useState("");

  const segmentsQuery = useQuery({
    queryKey: ["predict", "segments"],
    queryFn: api.fetchSegments,
  });

  const segments = useMemo(() => {
    return segmentsQuery.data || [];
  }, [segmentsQuery.data]);

  const selected = useMemo(() => {
    return segments.find((s) => s.id === selectedSegmentId) || null;
  }, [segments, selectedSegmentId]);

  const affectedQuery = useQuery({
    enabled: Boolean(selectedSegmentId),
    queryKey: ["predict", "affected", selectedSegmentId],
    queryFn: () => api.fetchAffectedSegments(selectedSegmentId),
  });

  const spreadQuery = useQuery({
    enabled: Boolean(selectedSegmentId),
    queryKey: ["predict", "spread", selectedSegmentId],
    queryFn: () => api.fetchSpreadMapData(selectedSegmentId),
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

      <Container maxWidth="lg" className={styles.section}>
        {/* Select */}
        <Box className={styles.selectWrap}>
          <Autocomplete
            fullWidth
            size="small"
            options={segments}
            value={selected}
            inputValue={segmentSearchText}
            loading={segmentsQuery.isLoading}
            clearOnEscape
            getOptionLabel={(option) => option?.name || ""}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onInputChange={handleSearchInputChange}
            onChange={(_, value) => {
              if (value) {
                setSelectedSegmentId(value.id);
                setSegmentSearchText(value.name);
              } else {
                setSelectedSegmentId("");
                setSegmentSearchText("");
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Enter the name of the road segment you want to predict."
                placeholder="Ví dụ: Nguyễn Huệ, Điện Biên Phủ..."
              />
            )}
          />
          {segmentsQuery.isLoading ? (
            <Loading label="Loading segments..." />
          ) : null}
          {segmentsQuery.error ? (
            <ErrorState error={segmentsQuery.error} />
          ) : null}
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