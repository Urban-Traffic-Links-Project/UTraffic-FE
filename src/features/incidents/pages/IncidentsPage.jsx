import { Box, Button, Container, Typography } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { ErrorState } from "../../../shared/components/ErrorState";
import { Loading } from "../../../shared/components/Loading";
import { IncidentsMap } from "../ui/IncidentsMap";
import * as api from "../api/incidentsApi.http";

function iconCategoryToColor(iconCategory) {
  const cat = Number(iconCategory);
  // A pragmatic palette by severity/type; can refine later
  if (cat === 8) return "#6d28d9"; // RoadClosed
  if (cat === 7) return "#7c2d12"; // LaneClosed
  if (cat === 9) return "#2563eb"; // RoadWorks
  if (cat === 1) return "#ef4444"; // Accident
  if (cat === 6) return "#b91c1c"; // Jam
  return "#f59e0b"; // other
}

export function IncidentsPage() {
  const queryClient = useQueryClient();

  const incidentsQuery = useQuery({
    queryKey: ["incidents", "list"],
    queryFn: () => api.fetchIncidents({ limit: 80 }),
    refetchInterval: 60_000,
  });

  const incidents = incidentsQuery.data?.incidents || [];

  async function handleFetchNow() {
    await api.fetchAndSaveIncidents();
    await queryClient.invalidateQueries({ queryKey: ["incidents", "list"] });
  }

  return (
    <Box>
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <Box>
            <Typography variant="h6">Incidents (TomTom)</Typography>
            <Typography variant="body2" color="text.secondary">
              Shows matched road edges for the latest fetched incidents.
            </Typography>
          </Box>
          <Button variant="contained" onClick={handleFetchNow} disabled={incidentsQuery.isLoading}>
            Fetch now
          </Button>
        </Box>

        <Box sx={{ mt: 2 }}>
          {incidentsQuery.isLoading ? <Loading label="Loading incidents..." /> : null}
          {incidentsQuery.error ? <ErrorState error={incidentsQuery.error} /> : null}
          <IncidentsMap
            incidents={incidents}
            getColor={(inc) => iconCategoryToColor(inc.icon_category)}
          />
        </Box>
      </Container>
    </Box>
  );
}

