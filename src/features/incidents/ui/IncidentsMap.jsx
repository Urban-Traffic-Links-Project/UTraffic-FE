import { useMemo } from "react";
import { GeoJSON, MapContainer, TileLayer } from "react-leaflet";

const HCMC = [10.78, 106.695];

function buildFeatureCollection(incidents = []) {
  const features = [];

  incidents.forEach((inc) => {
    const edges = inc.matched_edges || [];
    edges.forEach((e) => {
      if (!e?.geometry) return;
      features.push({
        type: "Feature",
        geometry: e.geometry,
        properties: {
          incident_id: inc.id,
          tomtom_incident_id: inc.tomtom_incident_id,
          icon_category: inc.icon_category,
          icon_category_label: inc.icon_category_label,
          magnitude_of_delay: inc.magnitude_of_delay,
          delay_seconds: inc.delay_seconds,
          time_validity: inc.time_validity,
          rank: e.rank,
          match_dist_m: e.match_dist_m,
          overlap_m: e.overlap_m,
        },
      });
    });
  });

  return { type: "FeatureCollection", features };
}

export function IncidentsMap({ incidents, getColor }) {
  const collection = useMemo(() => buildFeatureCollection(incidents), [incidents]);

  return (
    <MapContainer center={HCMC} zoom={14} style={{ height: 520, width: "100%", borderRadius: 12 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <GeoJSON
        key={collection.features.length}
        data={collection}
        style={(feature) => {
          const props = feature?.properties || {};
          const color = getColor ? getColor(props) : "#ef4444";
          const weight = props.rank === 1 ? 6 : 4;
          return { color, weight, opacity: 0.92 };
        }}
        onEachFeature={(feature, layer) => {
          const p = feature?.properties || {};
          const title = [
            `Category: ${p.icon_category_label ?? p.icon_category ?? "Unknown"}`,
            p.magnitude_of_delay ? `Magnitude: ${p.magnitude_of_delay}` : null,
            p.delay_seconds !== null && p.delay_seconds !== undefined ? `Delay(s): ${p.delay_seconds}` : null,
            p.time_validity ? `Time: ${p.time_validity}` : null,
            p.match_dist_m ? `Match dist(m): ${Number(p.match_dist_m).toFixed(1)}` : null,
            p.overlap_m ? `Overlap(m): ${Number(p.overlap_m).toFixed(1)}` : null,
            p.tomtom_incident_id ? `TomTom ID: ${p.tomtom_incident_id}` : null,
          ]
            .filter(Boolean)
            .join("<br/>");
          layer.bindPopup(title);
        }}
      />
    </MapContainer>
  );
}

