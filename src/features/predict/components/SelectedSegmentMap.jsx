import { Box, Typography } from "@mui/material";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import {
  GeoJSON,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  CircleMarker,
} from "react-leaflet";
import styles from "../pages/PredictCongestionPage.module.css";

// Fixed boundary center (District 1 bbox): minLon,minLat,maxLon,maxLat
const INCIDENT_BBOX = {
  minLon: 106.67422,
  minLat: 10.75863,
  maxLon: 106.71737,
  maxLat: 10.80598,
};
const BBOX_CENTER = [
  (INCIDENT_BBOX.minLat + INCIDENT_BBOX.maxLat) / 2,
  (INCIDENT_BBOX.minLon + INCIDENT_BBOX.maxLon) / 2,
];
const DEFAULT_ZOOM = 14;

// Sửa lỗi icon marker mặc định của Leaflet khi build với Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL(
    "leaflet/dist/images/marker-icon-2x.png",
    import.meta.url
  ).toString(),
  iconUrl: new URL(
    "leaflet/dist/images/marker-icon.png",
    import.meta.url
  ).toString(),
  shadowUrl: new URL(
    "leaflet/dist/images/marker-shadow.png",
    import.meta.url
  ).toString(),
});

function MapViewportController({ selected, affectedItems = [] }) {
  const map = useMap();

  const path = useMemo(() => normalizeSegmentPath(selected), [selected]);
  const center = useMemo(() => getSegmentCenter(selected, path), [selected, path]);

  useEffect(() => {
    // đảm bảo map tính lại kích thước nếu vừa render xong trong container động
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    const collectivePoints = [...path];
    
    affectedItems.forEach(item => {
      if (item.lat && item.lng) {
        collectivePoints.push([item.lat, item.lng]);
      }
    });

    if (collectivePoints.length >= 2) {
      const bounds = L.latLngBounds(collectivePoints);
      map.flyToBounds(bounds, {
        padding: [20, 20],
        maxZoom: 16,
        duration: 0.8,
      });
      return;
    }

    if (center) {
      map.flyTo(center, 16, {
        duration: 0.8,
      });
      return;
    }

    map.flyTo(BBOX_CENTER, DEFAULT_ZOOM, {
      duration: 0.8,
    });
  }, [map, path, center, affectedItems]);

  return null;
}

function normalizeSegmentPath(segment) {
  if (!segment) return [];

  // Ưu tiên GeoJSON LineString
  if (
    segment.geometry?.type === "LineString" &&
    Array.isArray(segment.geometry.coordinates)
  ) {
    return segment.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  }

  // GeoJSON Feature
  if (
    segment.geometry?.geometry?.type === "LineString" &&
    Array.isArray(segment.geometry.geometry.coordinates)
  ) {
    return segment.geometry.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  }

  // coordinates dạng [ [lat, lng], [lat, lng] ]
  if (
    Array.isArray(segment.coordinates) &&
    segment.coordinates.length > 0 &&
    Array.isArray(segment.coordinates[0]) &&
    segment.coordinates[0].length >= 2
  ) {
    return segment.coordinates.map(([a, b]) => {
      // nếu dữ liệu là [lng, lat] thì đổi lại
      if (a > 30) return [b, a];
      return [a, b];
    });
  }

  // path dạng object [{lat,lng}]
  if (Array.isArray(segment.path) && segment.path.length > 0) {
    return segment.path
      .map((p) => {
        if (Array.isArray(p) && p.length >= 2) {
          const [a, b] = p;
          return a > 30 ? [b, a] : [a, b];
        }
        if (typeof p === "object" && p?.lat != null && p?.lng != null) {
          return [p.lat, p.lng];
        }
        return null;
      })
      .filter(Boolean);
  }

  // GeoJSON Point
  if (
    segment.geometry?.type === "Point" &&
    Array.isArray(segment.geometry.coordinates)
  ) {
    return [segment.geometry.coordinates[1], segment.geometry.coordinates[0]];
  }

  return [];
}

function getSegmentCenter(segment, path) {
  if (path.length >= 2) {
    const mid = path[Math.floor(path.length / 2)];
    return mid;
  }

  if (Array.isArray(segment?.center) && segment.center.length >= 2) {
    const [a, b] = segment.center;
    return a > 30 ? [b, a] : [a, b];
  }

  if (segment?.center?.lat != null && segment?.center?.lng != null) {
    return [segment.center.lat, segment.center.lng];
  }

  if (segment?.lat != null && segment?.lng != null) {
    return [segment.lat, segment.lng];
  }

  return null;
}

function buildIncidentEdgeFeatures(incidents = []) {
  const features = [];
  incidents.forEach((inc) => {
    // Thêm bản thân incident geom
    if (inc.geometry) {
      features.push({
        type: "Feature",
        geometry: typeof inc.geometry === 'string' ? JSON.parse(inc.geometry) : inc.geometry,
        properties: {
          incident_id: inc.id,
          tomtom_incident_id: inc.tomtom_incident_id,
          icon_category: inc.icon_category,
          icon_category_label: inc.icon_category_label,
          magnitude_of_delay: inc.magnitude_of_delay,
          delay_seconds: inc.delay_seconds,
          is_raw_incident: true, // đánh dấu đây là incident thật, không phải edge
        },
      });
    }

    // Thêm các cạnh map được (nếu có)
    const edges = inc?.matched_edges || [];
    edges.forEach((e) => {
      if (!e?.geometry) return;
      features.push({
        type: "Feature",
        geometry: typeof e.geometry === 'string' ? JSON.parse(e.geometry) : e.geometry,
        properties: {
          incident_id: inc.id,
          tomtom_incident_id: inc.tomtom_incident_id,
          icon_category: inc.icon_category,
          icon_category_label: inc.icon_category_label,
          magnitude_of_delay: inc.magnitude_of_delay,
          delay_seconds: inc.delay_seconds,
          is_raw_incident: false,
        },
      });
    });
  });
  return features;
}

export function SelectedSegmentMap({ selected, incidents = [], affectedItems = [], arrows = [], origin = null, onSelect }) {
  const path = useMemo(() => normalizeSegmentPath(selected), [selected]);
  const center = useMemo(() => getSegmentCenter(selected, path), [selected, path]);
  const incidentFeatures = useMemo(() => buildIncidentEdgeFeatures(incidents), [incidents]);

  const affectedPoints = useMemo(() => {
    if (!Array.isArray(affectedItems)) return [];
    return affectedItems.filter(item => item.lat && item.lng);
  }, [affectedItems]);

  return (
    <Box className={styles.mapBlock}>

      <Box className={styles.mapShell}>
        <MapContainer
          center={BBOX_CENTER}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom
          className={styles.leafletMap}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors &copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          <MapViewportController selected={selected} affectedItems={affectedItems} />

          {/* Incident overlay (matched edges) */}
          {incidentFeatures.length ? (
            <GeoJSON
              key={`inc-${incidentFeatures.length}`}
              data={{ type: "FeatureCollection", features: incidentFeatures }}
              style={(feature) => {
                const p = feature?.properties || {};
                const cat = Number(p.icon_category);
                const color =
                  cat === 8 ? "#6d28d9" :
                  cat === 7 ? "#7c2d12" :
                  cat === 9 ? "#2563eb" :
                  cat === 1 ? "#ef4444" :
                  cat === 6 ? "#b91c1c" :
                  "#f59e0b";
                return { color, weight: 5, opacity: 0.9 };
              }}
              onEachFeature={(feature, layer) => {
                const p = feature?.properties || {};
                const title = [
                  `Loại: ${p.icon_category_label ?? p.icon_category ?? "Không xác định"}`,
                  p.magnitude_of_delay ? `Mức độ trễ: ${p.magnitude_of_delay}` : null,
                  p.delay_seconds !== null && p.delay_seconds !== undefined ? `Thời gian trễ(s): ${p.delay_seconds}` : null,
                ]
                  .filter(Boolean)
                  .join("<br/>");
                layer.bindPopup(title);
                layer.on('click', () => {
                  if (onSelect && p.incident_id) {
                    onSelect(p.incident_id);
                  }
                });
              }}
            />
          ) : null}

          {path.length >= 2 ? (
            <>
              <Polyline
                positions={path}
                pathOptions={{
                  color: "#d32f2f",
                  weight: 7,
                  opacity: 0.9,
                }}
              />
              <Marker position={path[Math.floor(path.length / 2)]}>
                <Popup>{selected?.name || "Đoạn đường đang chọn"}</Popup>
              </Marker>
            </>
          ) : center ? (
            <Marker position={center}>
              <Popup>{selected?.name || "Đoạn đường đang chọn"}</Popup>
            </Marker>
          ) : null}



          {/* Affected points overlay */}
          {affectedPoints.map((item, idx) => {
            const color = item.level === "Cao" ? "#d32f2f" : item.level === "Trung bình" ? "#f9a825" : "#2e7d32";
            return (
              <CircleMarker
                key={`aff-${item.segmentId}-${idx}`}
                center={[item.lat, item.lng]}
                radius={item.level === "Cao" ? 10 : item.level === "Trung bình" ? 7 : 5}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: 0.7,
                  weight: 2,
                }}
              >
                <Popup>
                  <strong>{item.name}</strong>
                  <br/>
                  Mức độ: {item.level}
                  <br/>
                  Điểm số: {(item.score * 100).toFixed(2)}%
                </Popup>
              </CircleMarker>
            );
          })}

          {/* Causality arrows */}
          {arrows.map((arrow, idx) => (
            <Polyline
              key={`arrow-${idx}`}
              positions={[
                [arrow.from.lat, arrow.from.lng],
                [arrow.to.lat, arrow.to.lng]
              ]}
              pathOptions={{
                color: arrow.mode === "cause" ? "#ff8f00" : "#1976d2", // Amber for cause, Blue for spread
                weight: 2 + arrow.weight * 3,
                dashArray: "5, 10",
                opacity: 0.8,
              }}
            />
          ))}
        </MapContainer>

        {!path.length && !center ? (
          <Box className={styles.mapOverlayHint}>
            <Typography className={styles.caption}>
              Vui lòng chọn một sự cố để dự đoán mức độ lan truyền.
            </Typography>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}