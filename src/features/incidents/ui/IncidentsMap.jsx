import { useEffect, useMemo } from "react";
import { GeoJSON, MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

// Tâm mặc định: vùng Xa lộ Hà Nội, Thủ Đức theo yêu cầu của người dùng
const DEFAULT_CENTER = [10.791375, 106.79807];

function MapViewportController({ selectedIncident, defaultCenter }) {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (!selectedIncident) {
      if (defaultCenter) {
        map.flyTo(defaultCenter, 14, { duration: 0.8 });
      }
      return;
    }

    const points = [];
    const edges = selectedIncident.matched_edges || [];
    edges.forEach((e) => {
      if (e?.geometry?.coordinates) {
        if (e.geometry.type === "LineString") {
          e.geometry.coordinates.forEach(([lng, lat]) => {
            points.push([lat, lng]);
          });
        } else if (e.geometry.type === "Point") {
          points.push([e.geometry.coordinates[1], e.geometry.coordinates[0]]);
        }
      }
    });

    if (points.length === 0 && selectedIncident.geometry?.coordinates) {
      const geom = selectedIncident.geometry;
      if (geom.type === "LineString") {
        geom.coordinates.forEach(([lng, lat]) => {
          points.push([lat, lng]);
        });
      } else if (geom.type === "Point") {
        points.push([geom.coordinates[1], geom.coordinates[0]]);
      }
    }

    if (points.length > 0) {
      if (points.length === 1) {
        map.flyTo(points[0], 16, { duration: 0.8 });
      } else {
        const bounds = L.latLngBounds(points);
        map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 16, duration: 0.8 });
      }
    }
  }, [map, selectedIncident, defaultCenter]);

  return null;
}

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

    // Cũng vẽ cả geometry của bản thân incident nếu có dạng LineString/Point
    if (inc.geometry) {
      features.push({
        type: "Feature",
        geometry: inc.geometry,
        properties: {
          incident_id: inc.id,
          tomtom_incident_id: inc.tomtom_incident_id,
          icon_category: inc.icon_category,
          icon_category_label: inc.icon_category_label,
          magnitude_of_delay: inc.magnitude_of_delay,
          delay_seconds: inc.delay_seconds,
          time_validity: inc.time_validity,
          is_raw_incident: true,
        },
      });
    }
  });

  return { type: "FeatureCollection", features };
}

export function IncidentsMap({ incidents, selectedIncident, onSelectIncident, getColor }) {
  const collection = useMemo(() => buildFeatureCollection(incidents), [incidents]);

  return (
    <MapContainer center={DEFAULT_CENTER} zoom={14} style={{ height: 550, width: "100%", borderRadius: 12 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapViewportController selectedIncident={selectedIncident} defaultCenter={DEFAULT_CENTER} />

      <GeoJSON
        key={`${collection.features.length}-${selectedIncident?.id || "none"}`}
        data={collection}
        style={(feature) => {
          const props = feature?.properties || {};
          const isSelected = selectedIncident && props.incident_id === selectedIncident.id;
          const color = getColor ? getColor(props) : "#ef4444";
          
          if (props.is_raw_incident) {
            // Raw incident path (dotted/dashed or thick highlight)
            return {
              color: isSelected ? "#00b0ff" : color,
              weight: isSelected ? 8 : 4,
              opacity: 0.95,
              dashArray: "6, 4",
            };
          }

          return {
            color: isSelected ? "#00b0ff" : color,
            weight: isSelected ? 8 : (props.rank === 1 ? 6 : 4),
            opacity: isSelected ? 0.98 : 0.85,
          };

        }}
        onEachFeature={(feature, layer) => {
          const p = feature?.properties || {};
          const title = [
            `Loại sự cố: ${p.icon_category_label ?? p.icon_category ?? "Không xác định"}`,
            p.magnitude_of_delay ? `Mức độ trễ: ${p.magnitude_of_delay}` : null,
            p.delay_seconds !== null && p.delay_seconds !== undefined ? `Thời gian trễ(s): ${p.delay_seconds}` : null,
            p.time_validity ? `Thời gian: ${p.time_validity}` : null,
            p.tomtom_incident_id ? `TomTom ID: ${p.tomtom_incident_id}` : null,
            p.is_raw_incident ? `<b>(Đoạn sự cố gốc)</b>` : null,
          ]
            .filter(Boolean)
            .join("<br/>");
          layer.bindPopup(title);

          layer.on("click", (e) => {
            L.DomEvent.stopPropagation(e);
            if (onSelectIncident && p.incident_id) {
              onSelectIncident(p.incident_id);
            }
          });
        }}
      />
    </MapContainer>
  );
}


