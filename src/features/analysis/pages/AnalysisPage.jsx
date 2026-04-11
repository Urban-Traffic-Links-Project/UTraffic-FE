import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, Grid } from "@mui/material";

import { PageHeader } from "../../../shared/components/PageHeader";
import { Loading } from "../../../shared/components/Loading";
import { ErrorState } from "../../../shared/components/ErrorState";
import { EmptyState } from "../../../shared/components/EmptyState";
import { qk } from "../../../shared/lib/queryKeys";

import { analysisApi } from "../api";
import { useAnalysisStore } from "../state/useAnalysisStore";

import { FiltersBar } from "../components/Filters/FiltersBar";
import { NetworkToolbar } from "../components/Network/NetworkToolbar";
import { NetworkLegend } from "../components/Network/NetworkLegend";
import { NetworkGraph } from "../components/Network/NetworkGraph";
import { CorrelationHeatmap } from "../components/Heatmap/CorrelationHeatmap";
import { PairsTable } from "../components/Pairs/PairsTable";
import { PairDetailDrawer } from "../components/Pairs/PairDetailDrawer";

export function AnalysisPage() {
  const {
    filters,
    setFilters,
    viewMode,
    setViewMode,
    selectedNodeId,
    selectedPair,
    selectNode,
    selectPair,
    clearSelection,
  } = useAnalysisStore();

  const nodesQuery = useQuery({
    queryKey: qk.analysis.nodes(filters),
    queryFn: () => analysisApi.fetchNodes(filters),
  });

  const edgesQuery = useQuery({
    queryKey: qk.analysis.edges(filters),
    queryFn: () => analysisApi.fetchEdges(filters),
  });

  const matrixQuery = useQuery({
    queryKey: qk.analysis.matrix(filters),
    queryFn: () => analysisApi.fetchCorrelationMatrix(filters),
  });

  const drawerOpen = Boolean(selectedNodeId || selectedPair);

  const leftNodeId = selectedNodeId || selectedPair?.source || null;
  const rightNodeId = selectedNodeId ? selectedNodeId : (selectedPair?.target || null);

  const leftSeriesQuery = useQuery({
    enabled: Boolean(leftNodeId),
    queryKey: qk.analysis.series(leftNodeId, filters),
    queryFn: () => analysisApi.fetchTimeSeries(leftNodeId, filters),
  });

  const rightSeriesQuery = useQuery({
    enabled: Boolean(rightNodeId),
    queryKey: qk.analysis.series(rightNodeId, filters),
    queryFn: () => analysisApi.fetchTimeSeries(rightNodeId, filters),
  });

  const title = useMemo(() => {
    if (selectedNodeId) return `Node: ${selectedNodeId}`;
    if (selectedPair) return `Pair: ${selectedPair.source} ↔ ${selectedPair.target}`;
    return "Details";
  }, [selectedNodeId, selectedPair]);

  const corrHint = useMemo(() => {
    if (!selectedPair || !matrixQuery.data) return null;
    const ids = matrixQuery.data.ids;
    const i = ids.indexOf(selectedPair.source);
    const j = ids.indexOf(selectedPair.target);
    if (i < 0 || j < 0) return null;
    return matrixQuery.data.values[i][j];
  }, [selectedPair, matrixQuery.data]);

  return (
    <Box>
      <PageHeader
        title="Analysis"
        subtitle="Mock-ready UI for correlation analysis between traffic intersections"
      />

      <Box sx={{ mb: 2 }}>
        <FiltersBar filters={filters} onChange={setFilters} />
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <NetworkToolbar
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onClearSelection={clearSelection}
              />
            </Grid>

            <Grid item xs={12} md={8}>
              {nodesQuery.isLoading || edgesQuery.isLoading ? (
                <Loading label="Loading network..." />
              ) : null}

              {nodesQuery.error ? <ErrorState error={nodesQuery.error} /> : null}
              {edgesQuery.error ? <ErrorState error={edgesQuery.error} /> : null}

              {nodesQuery.data && edgesQuery.data ? (
                <NetworkGraph
                  nodes={nodesQuery.data}
                  edges={edgesQuery.data}
                  onSelectNode={selectNode}
                  onSelectPair={selectPair}
                />
              ) : (
                <EmptyState title="No network data" />
              )}
            </Grid>

            <Grid item xs={12} md={4}>
              <NetworkLegend edgesCount={edgesQuery.data?.length} threshold={filters.threshold} />
            </Grid>

            <Grid item xs={12}>
              {matrixQuery.isLoading ? <Loading label="Loading correlation matrix..." /> : null}
              {matrixQuery.error ? <ErrorState error={matrixQuery.error} /> : null}
              {matrixQuery.data ? (
                <CorrelationHeatmap matrix={matrixQuery.data} onSelectPair={selectPair} />
              ) : (
                <EmptyState title="No matrix data" />
              )}
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} lg={4}>
          {edgesQuery.data ? (
            <PairsTable edges={edgesQuery.data} onSelectPair={selectPair} />
          ) : (
            <EmptyState title="No pairs yet" />
          )}
        </Grid>
      </Grid>

      <PairDetailDrawer
        open={drawerOpen}
        title={title}
        onClose={clearSelection}
        leftQuery={leftSeriesQuery}
        rightQuery={rightSeriesQuery}
        corrHint={corrHint}
      />
    </Box>
  );
}
