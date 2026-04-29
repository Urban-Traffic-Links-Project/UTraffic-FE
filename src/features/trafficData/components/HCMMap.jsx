import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import {
  GeoJSON,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import styles from "./HCMMap.module.css";

const SHOW_ALL_ROADS_ZOOM = 15;
const ROAD_MATCH_DISTANCE_METERS = 45;

const DISTRICT_1_BOUNDS = [
  [10.753522, 106.672782],
  [10.793739, 106.71012],
];

const MAJOR_HIGHWAY_TYPES = new Set([
  "motorway",
  "trunk",
  "primary",
  "motorway_link",
  "trunk_link",
  "primary_link",
  "secondary",
]);

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

function ZoomWatcher({ onZoomChange }) {
  const map = useMapEvents({
    zoomend() {
      onZoomChange(map.getZoom());
    },
  });

  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);

  return null;
}

function getTrafficColor(feature) {
  const speed = Number(feature?.properties?.speed);

  if (!Number.isNaN(speed)) {
    if (speed < 18) return "#b71c1c";
    if (speed < 25) return "#f4c430";
    return "#16c784";
  }

  const status = String(feature?.properties?.status || "").toLowerCase();

  if (status.includes("congest") || status.includes("jam")) return "#b71c1c";
  if (status.includes("moderate") || status.includes("medium")) return "#f4c430";

  return "#16c784";
}

function isMajorOsmRoad(feature) {
  const highway = String(feature?.properties?.highway || "").toLowerCase();

  return MAJOR_HIGHWAY_TYPES.has(highway);
}

function getFeatureCoordinates(feature) {
  const geometry = feature?.geometry;

  if (!geometry) return [];

  if (geometry.type === "Point") {
    return [geometry.coordinates];
  }

  if (geometry.type === "MultiPoint" || geometry.type === "LineString") {
    return geometry.coordinates;
  }

  if (geometry.type === "MultiLineString" || geometry.type === "Polygon") {
    return geometry.coordinates.flat();
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flat(2);
  }

  return [];
}

function getFeatureCenter(feature) {
  const coords = getFeatureCoordinates(feature);

  if (!coords.length) return null;

  const total = coords.reduce(
    (acc, coord) => {
      acc.lng += coord[0];
      acc.lat += coord[1];
      return acc;
    },
    { lng: 0, lat: 0 }
  );

  return [total.lng / coords.length, total.lat / coords.length];
}

function lngLatToMeters([lng, lat], refLat) {
  const metersPerDegreeLat = 111_320;
  const metersPerDegreeLng = 111_320 * Math.cos((refLat * Math.PI) / 180);

  return {
    x: lng * metersPerDegreeLng,
    y: lat * metersPerDegreeLat,
  };
}

function distancePointToSegmentMeters(point, segStart, segEnd) {
  const refLat = point[1];

  const p = lngLatToMeters(point, refLat);
  const a = lngLatToMeters(segStart, refLat);
  const b = lngLatToMeters(segEnd, refLat);

  const dx = b.x - a.x;
  const dy = b.y - a.y;

  if (dx === 0 && dy === 0) {
    return Math.hypot(p.x - a.x, p.y - a.y);
  }

  const t = Math.max(
    0,
    Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy))
  );

  const nearest = {
    x: a.x + t * dx,
    y: a.y + t * dy,
  };

  return Math.hypot(p.x - nearest.x, p.y - nearest.y);
}

function buildMajorRoadSegments(roadNetworkData) {
  if (!roadNetworkData?.features?.length) return [];

  const segments = [];

  roadNetworkData.features.forEach((feature) => {
    if (!isMajorOsmRoad(feature)) return;

    const geometry = feature.geometry;

    if (!geometry) return;

    if (geometry.type === "LineString") {
      const coords = geometry.coordinates;

      for (let i = 0; i < coords.length - 1; i++) {
        segments.push([coords[i], coords[i + 1]]);
      }
    }

    if (geometry.type === "MultiLineString") {
      geometry.coordinates.forEach((line) => {
        for (let i = 0; i < line.length - 1; i++) {
          segments.push([line[i], line[i + 1]]);
        }
      });
    }
  });

  return segments;
}

function inferTrafficRoadClass(feature, majorRoadSegments) {
  const existingRoadClass = String(feature?.properties?.road_class || "").toLowerCase();

  if (existingRoadClass === "major" || existingRoadClass === "small") {
    return existingRoadClass;
  }

  const highway = String(feature?.properties?.highway || "").toLowerCase();

  if (MAJOR_HIGHWAY_TYPES.has(highway)) {
    return "major";
  }

  const center = getFeatureCenter(feature);

  if (!center || !majorRoadSegments.length) {
    return "small";
  }

  let minDistance = Number.POSITIVE_INFINITY;

  for (const [start, end] of majorRoadSegments) {
    const distance = distancePointToSegmentMeters(center, start, end);

    if (distance < minDistance) {
      minDistance = distance;
    }

    if (minDistance <= ROAD_MATCH_DISTANCE_METERS) {
      return "major";
    }
  }

  return "small";
}

export default function HCMMap({ isSidebarCollapsed }) {
  const [trafficData, setTrafficData] = useState(null);
  const [roadNetworkData, setRoadNetworkData] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(null);

  useEffect(() => {
    fetch("/geojson/traffic_data.geojson")
      .then((res) => res.json())
      .then((data) => {
        console.log("Traffic data sample:", data?.features?.[0]);
        setTrafficData(data);
      })
      .catch((err) => {
        console.error("Failed to load traffic GeoJSON:", err);
      });
  }, []);

  useEffect(() => {
    fetch("/geojson/road_network_Quan1.geojson")
      .then((res) => res.json())
      .then((data) => {
        console.log("Road network Q1 sample:", data?.features?.[0]);
        setRoadNetworkData(data);
      })
      .catch((err) => {
        console.error("Failed to load Q1 road network GeoJSON:", err);
      });
  }, []);

  const majorRoadSegments = useMemo(() => {
    return buildMajorRoadSegments(roadNetworkData);
  }, [roadNetworkData]);

  const classifiedTrafficData = useMemo(() => {
    if (!trafficData) return null;

    return {
      ...trafficData,
      features: trafficData.features.map((feature) => {
        const roadClass = inferTrafficRoadClass(feature, majorRoadSegments);

        return {
          ...feature,
          properties: {
            ...feature.properties,
            road_class: roadClass,
          },
        };
      }),
    };
  }, [trafficData, majorRoadSegments]);

  const bounds = useMemo(() => {
    if (roadNetworkData) {
      return L.geoJSON(roadNetworkData).getBounds();
    }

    return L.latLngBounds(DISTRICT_1_BOUNDS);
  }, [roadNetworkData]);

  if (!trafficData || !bounds) {
    return <div className={styles.mapLoading}>Loading map...</div>;
  }

  const showAllRoads = zoomLevel >= SHOW_ALL_ROADS_ZOOM;

  const getRoadNetworkStyle = (feature) => {
    const major = isMajorOsmRoad(feature);

    if (!major && !showAllRoads) {
      return {
        color: "transparent",
        weight: 0,
        opacity: 0,
      };
    }

    return {
      color: major ? "#475569" : "#94a3b8",
      weight: major ? 3 : 1,
      opacity: major ? 0.35 : 0.18,
    };
  };

  const getTrafficStyle = (feature) => {
    const roadClass = String(feature?.properties?.road_class || "").toLowerCase();
    const isMajor = roadClass === "major";

    if (!isMajor && !showAllRoads) {
      return {
        color: "transparent",
        weight: 0,
        opacity: 0,
      };
    }

    return {
      color: getTrafficColor(feature),
      weight: isMajor ? 5 : 3,
      opacity: isMajor ? 0.9 : 0.75,
    };
  };

  return (
    <div className={styles.mapWrapper}>
      <MapContainer
        bounds={bounds}
        minZoom={10}
        scrollWheelZoom={true}
        className={styles.leafletMap}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* {roadNetworkData && (
          <GeoJSON
            key={`road-network-q1-${zoomLevel}`}
            data={roadNetworkData}
            style={getRoadNetworkStyle}
            onEachFeature={(feature, layer) => {
              const name = feature?.properties?.name || "Đường chưa có tên";
              const highway = feature?.properties?.highway || "unknown";
              const roadClass = isMajorOsmRoad(feature) ? "major" : "small";

              layer.bindPopup(`
                <strong>${name}</strong><br/>
                Loại OSM: ${highway}<br/>
                Phân loại: ${roadClass}
              `);
            }}
          />
        )} */}

        {classifiedTrafficData && (
          <GeoJSON
            key={`traffic-layer-${zoomLevel}-${classifiedTrafficData.features.length}`}
            data={classifiedTrafficData}
            style={getTrafficStyle}
            onEachFeature={(feature, layer) => {
              const speed = Number(feature?.properties?.speed || 0);
              const roadClass = feature?.properties?.road_class || "unknown";
              const name =
                feature?.properties?.name ||
                feature?.properties?.road_name ||
                feature?.properties?.roadName ||
                "Đoạn đường";

              layer.bindPopup(`
                <strong>${name}</strong><br/>
                Tốc độ: ${speed.toFixed(1)} km/h<br/>
                Phân loại: ${roadClass}
              `);
            }}
          />
        )}

        <ZoomWatcher onZoomChange={setZoomLevel} />
        <ResizeMap resizeKey={isSidebarCollapsed} />
      </MapContainer>
    </div>
  );
}