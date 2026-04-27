import { Box, Typography } from "@mui/material";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import styles from "../../pages/CorrelationAnalysisPage.module.css";

// Tâm mặc định TP.HCM
const HCMC_CENTER = [10.7769, 106.7009];
const DEFAULT_ZOOM = 12;

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

function MapViewportController({ selected }) {
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
    if (path.length >= 2) {
      const bounds = L.latLngBounds(path);
      map.flyToBounds(bounds, {
        padding: [40, 40],
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

    map.flyTo(HCMC_CENTER, DEFAULT_ZOOM, {
      duration: 0.8,
    });
  }, [map, path, center]);

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

export function SelectedSegmentMap({ selected }) {
  const path = useMemo(() => normalizeSegmentPath(selected), [selected]);
  const center = useMemo(() => getSegmentCenter(selected, path), [selected, path]);

  return (
    <Box className={styles.mapBlock}>
      <Box className={styles.mapShell}>
        <MapContainer
          center={HCMC_CENTER}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom
          className={styles.leafletMap}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapViewportController selected={selected} />

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
                <Popup>{selected?.name || "Selected segment"}</Popup>
              </Marker>
            </>
          ) : center ? (
            <Marker position={center}>
              <Popup>{selected?.name || "Selected segment"}</Popup>
            </Marker>
          ) : null}
        </MapContainer>

        {!path.length && !center ? (
          <Box className={styles.mapOverlayHint}>
            <Typography className={styles.caption}>
              Segment data does not contain map coordinates yet.
              Add <strong>center</strong>, <strong>coordinates</strong>, or
              GeoJSON <strong>geometry</strong> to display the selected road segment.
            </Typography>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}