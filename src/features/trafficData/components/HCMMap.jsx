import { useEffect } from "react";
import { MapContainer, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
import styles from "./HCMMap.module.css";

const TOMTOM_API_KEY = import.meta.env.VITE_TOMTOM_API_KEY;
const TOMTOM_FLOW_TILE_STYLE = "relative0";
const TOMTOM_FLOW_TILE_OPACITY = 0.88;

const DISTRICT_1_BOUNDS = [
  [10.753522, 106.672782],
  [10.793739, 106.71012],
];

const DISTRICT_1_CENTER = [10.7769, 106.7009];

function ResizeMap({ resizeKey }) {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => clearTimeout(timer);
  }, [map, resizeKey]);

  return null;
}

function ClickToSelectRoad({ onSegmentSelect }) {
  const map = useMapEvents({
    click(event) {
      const { lat, lng } = event.latlng;

      onSegmentSelect?.({
        id: `tomtom-click-${lat.toFixed(6)}-${lng.toFixed(6)}-${Date.now()}`,
        name: "Đoạn đường gần vị trí click",
        latitude: lat,
        longitude: lng,
        zoom: map.getZoom(),
        source: "tomtom-flow-segment",
      });
    },
  });

  return null;
}

function normalizeSelectedCoordinates(coordinates) {
  if (!Array.isArray(coordinates)) return [];

  return coordinates
    .map((point) => {
      const latitude = Number(point?.latitude ?? point?.lat);
      const longitude = Number(point?.longitude ?? point?.lng ?? point?.lon);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

      return [latitude, longitude];
    })
    .filter(Boolean);
}

export default function HCMMap({
  isSidebarCollapsed,
  selectedSegmentCoordinates = [],
  selectedSegmentId,
  onSegmentSelect,
}) {
  const selectedPolyline = normalizeSelectedCoordinates(selectedSegmentCoordinates);

  return (
    <div className={styles.mapWrapper}>
      <MapContainer
        bounds={DISTRICT_1_BOUNDS}
        center={DISTRICT_1_CENTER}
        zoom={14}
        minZoom={12}
        maxBounds={DISTRICT_1_BOUNDS}
        maxBoundsViscosity={0.85}
        scrollWheelZoom={true}
        className={styles.leafletMap}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {TOMTOM_API_KEY && (
          <TileLayer
            attribution='Traffic &copy; TomTom'
            url={`https://api.tomtom.com/traffic/map/4/tile/flow/${TOMTOM_FLOW_TILE_STYLE}/{z}/{x}/{y}.png?key=${TOMTOM_API_KEY}`}
            opacity={TOMTOM_FLOW_TILE_OPACITY}
            zIndex={450}
          />
        )}

        {selectedPolyline.length >= 2 && (
          <Polyline
            key={selectedSegmentId || selectedPolyline.map((p) => p.join(",")).join("|")}
            positions={selectedPolyline}
            pathOptions={{
              color: "#2563eb",
              weight: 8,
              opacity: 1,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        )}

        <ClickToSelectRoad onSegmentSelect={onSegmentSelect} />
        <ResizeMap
          resizeKey={`${isSidebarCollapsed || ""}-${selectedSegmentId || ""}-${selectedPolyline.length}`}
        />
      </MapContainer>

      {!TOMTOM_API_KEY && (
        <div className={styles.trafficApiMissing}>
          Chưa cấu hình VITE_TOMTOM_API_KEY nên chưa hiển thị lớp màu giao thông realtime.
        </div>
      )}
    </div>
  );
}
