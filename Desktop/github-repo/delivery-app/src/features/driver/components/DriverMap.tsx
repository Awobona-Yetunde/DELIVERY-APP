import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { DriverStatus, Order } from "../Dashboard";
import DriverChat from "./DriverChat";
import { MAPBOX_TOKEN, getRoute } from "../../../lib/mapbox";

const YOU_ICON = L.divIcon({
  html: `<div style="background:#F5A623;width:48px;height:48px;border-radius:50%;
    border:3px solid white;display:flex;align-items:center;justify-content:center;
    font-size:24px;box-shadow:0 4px 14px rgba(0,0,0,0.5);">🚗</div>`,
  className: "",
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

const PICKUP_ICON = L.divIcon({
  html: `<div style="background:#1A3C2E;width:36px;height:36px;border-radius:50%;
    border:3px solid #F5A623;display:flex;align-items:center;justify-content:center;
    font-size:18px;box-shadow:0 2px 10px rgba(0,0,0,0.4);">📦</div>`,
  className: "",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const DEST_ICON = L.divIcon({
  html: `<div style="background:#0D1F17;width:36px;height:36px;border-radius:50%;
    border:3px solid white;display:flex;align-items:center;justify-content:center;
    font-size:18px;box-shadow:0 2px 10px rgba(0,0,0,0.4);">🏁</div>`,
  className: "",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const MAPBOX_TILE_URL = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`;

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    map.fitBounds(L.latLngBounds(points), { padding: [60, 60] });
  }, [points, map]);
  return null;
}

export default function DriverMap({
  status,
  activeRun,
  driverLocation,
}: {
  status: DriverStatus;
  activeRun: Order | null;
  driverLocation: { lat: number; lng: number } | null;
}) {
  const [showChat, setShowChat] = useState(false);
  const [unread, setUnread] = useState(0);
  const [routePath, setRoutePath] = useState<[number, number][]>([]);

  // Fetch actual driving route when active run changes
  useEffect(() => {
    if (!activeRun) {
      setRoutePath([]);
      return;
    }
    const fetchRoute = async () => {
      const path = await getRoute(
        activeRun.origin_lat,
        activeRun.origin_lng,
        activeRun.destination_lat,
        activeRun.destination_lng,
      );
      setRoutePath(path);
    };
    fetchRoute();
  }, [activeRun?.id]);

  const center: [number, number] = driverLocation
    ? [driverLocation.lat, driverLocation.lng]
    : [7.2571, 5.2058];

  const boundsPoints: [number, number][] = [];
  if (driverLocation)
    boundsPoints.push([driverLocation.lat, driverLocation.lng]);
  if (activeRun) {
    boundsPoints.push([activeRun.origin_lat, activeRun.origin_lng]);
    boundsPoints.push([activeRun.destination_lat, activeRun.destination_lng]);
  }

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="flex-1" style={{ minHeight: "400px" }}>
        <MapContainer
          center={center}
          zoom={driverLocation ? 13 : 10}
          style={{ width: "100%", height: "100%" }}
          zoomControl={true}
        >
          <TileLayer
            attribution='© <a href="https://www.mapbox.com/">Mapbox</a>'
            url={MAPBOX_TILE_URL}
            tileSize={512}
            zoomOffset={-1}
          />

          {/* Driver's own location */}
          {driverLocation && (
            <Marker
              position={[driverLocation.lat, driverLocation.lng]}
              icon={YOU_ICON}
              zIndexOffset={1000}
            >
              <Popup>
                <div style={{ color: "#0D1F17", fontWeight: 600 }}>
                  📍 You are here
                </div>
              </Popup>
            </Marker>
          )}

          {/* Pickup marker */}
          {activeRun && (
            <Marker
              position={[activeRun.origin_lat, activeRun.origin_lng]}
              icon={PICKUP_ICON}
            >
              <Popup>
                <div style={{ color: "#0D1F17", fontWeight: 600 }}>
                  📦 Pickup
                </div>
                <div style={{ color: "#333", fontSize: 12 }}>
                  {activeRun.origin_park}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Destination marker */}
          {activeRun && (
            <Marker
              position={[activeRun.destination_lat, activeRun.destination_lng]}
              icon={DEST_ICON}
            >
              <Popup>
                <div style={{ color: "#0D1F17", fontWeight: 600 }}>
                  🏁 Drop off
                </div>
                <div style={{ color: "#333", fontSize: 12 }}>
                  {activeRun.destination}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Actual driving route */}
          {routePath.length > 0 && (
            <>
              <Polyline
                positions={routePath}
                pathOptions={{ color: "#000000", weight: 8, opacity: 0.2 }}
              />
              <Polyline
                positions={routePath}
                pathOptions={{
                  color: "#4A90D9",
                  weight: 5,
                  opacity: 0.9,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
            </>
          )}

          {boundsPoints.length >= 2 && <FitBounds points={boundsPoints} />}
        </MapContainer>
      </div>

      {/* Offline overlay */}
      {status === "offline" && (
        <div
          className="absolute inset-0 bg-surface/70 backdrop-blur-sm flex items-center justify-center"
          style={{ zIndex: 1000 }}
        >
          <div className="text-center">
            <div className="text-5xl mb-3 opacity-40">🗺️</div>
            <p className="text-light text-sm font-medium">
              Map inactive while offline
            </p>
            <p className="text-muted text-xs mt-1">
              Go online to activate live tracking
            </p>
          </div>
        </div>
      )}

      {/* Online waiting chip */}
      {status === "online" && !activeRun && (
        <div
          className="absolute top-3 left-3 right-3 pointer-events-none"
          style={{ zIndex: 1000 }}
        >
          <div className="bg-surface/90 backdrop-blur rounded-xl px-4 py-2.5 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
            <p className="text-light text-xs font-medium">
              You are live — waiting for orders
            </p>
          </div>
        </div>
      )}

      {/* On delivery strip */}
      {status === "on-delivery" && activeRun && (
        <div
          className="absolute top-3 left-3 right-3 pointer-events-none"
          style={{ zIndex: 1000 }}
        >
          <div className="bg-surface/90 backdrop-blur rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-xl">🚗</span>
            <div className="flex-1 min-w-0">
              <p className="text-light text-xs font-medium truncate">
                {activeRun.origin_park} → {activeRun.destination}
              </p>
              <p className="text-muted text-[10px]">
                {activeRun.distance_km} km · ~
                {activeRun.estimated_duration_mins} mins
              </p>
            </div>
            <p className="text-accent text-sm font-bold flex-shrink-0">
              ₦{activeRun.price?.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* GPS + Waybill chips */}
      {status !== "offline" && (
        <div
          className="absolute left-3 right-3 flex items-center justify-between pointer-events-none"
          style={{
            bottom: status === "on-delivery" ? "72px" : "12px",
            zIndex: 1000,
          }}
        >
          {driverLocation && (
            <div className="bg-surface/90 backdrop-blur rounded-xl px-3 py-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <p className="text-light text-[10px] font-medium">GPS active</p>
            </div>
          )}
          {activeRun && (
            <div className="ml-auto bg-surface/90 backdrop-blur rounded-xl px-3 py-2">
              <p className="text-muted text-[10px]">Waybill</p>
              <p className="text-accent text-xs font-bold">
                {activeRun.waybill_number}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Chat button */}
      {status === "on-delivery" && activeRun && (
        <div className="absolute bottom-4 right-4" style={{ zIndex: 1001 }}>
          <button
            onClick={() => {
              setShowChat(true);
              setUnread(0);
            }}
            className="relative w-12 h-12 bg-accent rounded-full flex items-center
              justify-center text-xl shadow-lg hover:bg-amber-400 transition-colors cursor-pointer"
          >
            💬
            {unread > 0 && (
              <span
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full
                text-white text-[10px] font-bold flex items-center justify-center"
              >
                {unread}
              </span>
            )}
          </button>
        </div>
      )}

      {showChat && activeRun && (
        <DriverChat
          orderId={activeRun.id}
          onClose={() => setShowChat(false)}
          onUnread={() => setUnread((p) => p + 1)}
        />
      )}
    </div>
  );
}
