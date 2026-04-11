import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { GeoJSON, MapContainer, TileLayer, useMap } from "react-leaflet";
import styles from "./HCMMap.module.css";

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

export default function HCMMap({ isSidebarCollapsed }) {
  const [trafficData, setTrafficData] = useState(null);

  useEffect(() => {
    fetch("/geojson/traffic_data.geojson")
      .then((res) => res.json())
      .then((data) => setTrafficData(data))
      .catch((err) => {
        console.error("Failed to load HCMC GeoJSON:", err);
      });
  }, []);

  const bounds = useMemo(() => {
    if (!trafficData) return null;
    return L.geoJSON(trafficData).getBounds();
  }, [trafficData]);

  if (!trafficData || !bounds) {
    return <div className={styles.mapLoading}>Loading map...</div>;
  }

  const getTrafficStyle = (feature) => {
    const speed = feature.properties.speed;
    let color = "#16c784";
    if (speed < 18) color = "#b71c1c";
    else if (speed < 25) color = "#f4c430";
    
    return { color: color, weight: 4, opacity: 0.8 };
  };

  return (
    <div className={styles.mapWrapper}>
      <MapContainer
        bounds={bounds}
        maxBounds={bounds}
        maxBoundsViscosity={1.0}
        minZoom={10}
        scrollWheelZoom={true}
        className={styles.leafletMap}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {trafficData && (
          <GeoJSON 
            data={trafficData} 
            style={getTrafficStyle}
            onEachFeature={(feature, layer) => {
              layer.bindPopup(`Tốc độ: ${feature.properties.speed.toFixed(1)} km/h`);
            }}
          />
        )}

        <ResizeMap resizeKey={isSidebarCollapsed} />
      </MapContainer>
    </div>
  );
}