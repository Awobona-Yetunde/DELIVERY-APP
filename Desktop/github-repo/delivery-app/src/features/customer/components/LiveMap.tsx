import { useEffect, useRef, useState, useCallback } from "react";
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
import type { DeliveryStage } from "../Dashboard";
import ChatWidget from "./ChatWidget";
import { MAPBOX_TOKEN, getRoute } from "../../../lib/mapbox";
import { WS_URL } from "../../../lib/config";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DRIVER_ICON = L.divIcon({
  html: `<div style="background:#F5A623;width:44px;height:44px;border-radius:50%;
    border:3px solid white;display:flex;align-items:center;justify-content:center;
    font-size:22px;box-shadow:0 4px 14px rgba(0,0,0,0.5);">🚗</div>`,
  className: "",
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

const ORIGIN_ICON = L.divIcon({
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

// Fits map to show all markers
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    map.fitBounds(L.latLngBounds(points), { padding: [60, 60] });
  }, [points, map]);
  return null;
}

// Mapbox dark tile URL
const MAPBOX_TILE_URL = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`;

export default function LiveMap({
  stage,
  order,
}: {
  stage: DeliveryStage;
  order: any;
}) {
  const wsRef = useRef<WebSocket | null>(null);
  const [driverLocation, setDriverLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [driverPos, setDriverPos] = useState<string | null>(null);

  // Fetch actual driving route when order exists
  useEffect(() => {
    if (!order) return;
    const fetchRoute = async () => {
      setRouteLoading(true);
      const path = await getRoute(
        order.origin_lat,
        order.origin_lng,
        order.destination_lat,
        order.destination_lng,
      );
      setRoutePath(path);
      setRouteLoading(false);
    };
    fetchRoute();
  }, [order?.id]);

  // WebSocket for live driver location
  useEffect(() => {
    if (stage !== "in-transit" || !order?.id) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    let isMounted = true;
    const connect = () => {
      if (!isMounted) return;
      const ws = new WebSocket(`${WS_URL}/tracking/ws/${order.id}`);
      wsRef.current = ws;

      ws.onopen = () => console.log("Tracking WS connected ✅");
      ws.onmessage = (e) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(e.data);
          if (data.type !== "location") return;
          setDriverLocation({ lat: data.lat, lng: data.lng });
          setLastSeen(new Date().toLocaleTimeString());
          setDriverPos(`${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`);
        } catch {}
      };
      ws.onclose = () => {
        if (isMounted) setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();
    };

    const timer = setTimeout(connect, 300);
    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [stage, order?.id]);

  const chatAvailable = order && ["matched", "in-transit"].includes(stage);

  // Build bounds to fit all points
  const boundsPoints: [number, number][] = [];
  if (order) {
    boundsPoints.push([order.origin_lat, order.origin_lng]);
    boundsPoints.push([order.destination_lat, order.destination_lng]);
  }
  if (driverLocation) {
    boundsPoints.push([driverLocation.lat, driverLocation.lng]);
  }

  const center: [number, number] = order
    ? [order.origin_lat, order.origin_lng]
    : [7.2571, 5.2058];

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="flex-1" style={{ minHeight: "300px" }}>
        <MapContainer
          center={center}
          zoom={order ? 8 : 7}
          style={{ width: "100%", height: "100%" }}
          zoomControl={true}
        >
          {/* Mapbox dark tiles — Uber-like look */}
          <TileLayer
            attribution='© <a href="https://www.mapbox.com/">Mapbox</a>'
            url={MAPBOX_TILE_URL}
            tileSize={512}
            zoomOffset={-1}
          />

          {/* Origin marker */}
          {order && (
            <Marker
              position={[order.origin_lat, order.origin_lng]}
              icon={ORIGIN_ICON}
            >
              <Popup>
                <div style={{ color: "#0D1F17", fontWeight: 600 }}>
                  📦 Pickup
                </div>
                <div style={{ color: "#333", fontSize: 12 }}>
                  {order.origin_park}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Destination marker */}
          {order && (
            <Marker
              position={[order.destination_lat, order.destination_lng]}
              icon={DEST_ICON}
            >
              <Popup>
                <div style={{ color: "#0D1F17", fontWeight: 600 }}>
                  🏁 Destination
                </div>
                <div style={{ color: "#333", fontSize: 12 }}>
                  {order.destination}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Driver marker — moves in real time */}
          {driverLocation && (
            <Marker
              position={[driverLocation.lat, driverLocation.lng]}
              icon={DRIVER_ICON}
              zIndexOffset={1000}
            >
              <Popup>
                <div style={{ color: "#0D1F17", fontWeight: 600 }}>
                  🚗 Your driver
                </div>
                <div style={{ color: "#333", fontSize: 12 }}>Live location</div>
              </Popup>
            </Marker>
          )}

          {/* Actual driving route — highlighted like Uber */}
          {routePath.length > 0 && (
            <>
              {/* Route shadow for depth */}
              <Polyline
                positions={routePath}
                pathOptions={{
                  color: "#000000",
                  weight: 8,
                  opacity: 0.2,
                }}
              />
              {/* Main route line — blue like Uber */}
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

          {/* Fallback straight line if route hasn't loaded yet */}
          {order && routePath.length === 0 && !routeLoading && (
            <Polyline
              positions={[
                [order.origin_lat, order.origin_lng],
                [order.destination_lat, order.destination_lng],
              ]}
              pathOptions={{
                color: "#F5A623",
                weight: 3,
                opacity: 0.5,
                dashArray: "8, 8",
              }}
            />
          )}

          {/* Fit map bounds */}
          {boundsPoints.length >= 2 && <FitBounds points={boundsPoints} />}
        </MapContainer>
      </div>

      {/* Idle overlay */}
      {stage === "idle" && (
        <div
          className="absolute inset-0 bg-surface/60 backdrop-blur-sm flex items-center justify-center"
          style={{ zIndex: 1000 }}
        >
          <div className="text-center">
            <div className="text-5xl mb-3">🗺️</div>
            <p className="text-light text-sm font-medium">
              Map loads when you book
            </p>
            <p className="text-muted text-xs mt-1">
              Route and driver shown here
            </p>
          </div>
        </div>
      )}

      {/* Route loading indicator */}
      {routeLoading && stage !== "idle" && (
        <div
          className="absolute top-3 left-3 right-3 pointer-events-none"
          style={{ zIndex: 1000 }}
        >
          <div className="bg-surface/90 backdrop-blur rounded-xl px-4 py-2.5 flex items-center gap-3">
            <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-light text-xs font-medium">Loading route...</p>
          </div>
        </div>
      )}

      {/* Searching / matched chip */}
      {!routeLoading &&
        (stage === "searching" || stage === "matched") &&
        order && (
          <div
            className="absolute top-3 left-3 right-3 pointer-events-none"
            style={{ zIndex: 1000 }}
          >
            <div className="bg-surface/90 backdrop-blur rounded-xl px-4 py-2.5 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse flex-shrink-0" />
              <p className="text-light text-xs font-medium">
                {stage === "searching"
                  ? "Looking for a driver..."
                  : "Driver matched — preparing for pickup"}
              </p>
            </div>
          </div>
        )}

      {/* Live tracking chip */}
      {!routeLoading && stage === "in-transit" && (
        <div
          className="absolute top-3 left-3 right-3 pointer-events-none"
          style={{ zIndex: 1000 }}
        >
          <div className="bg-surface/90 backdrop-blur rounded-xl px-4 py-2.5 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-light text-xs font-medium">
                {driverPos
                  ? `🚗 Driver at ${driverPos}`
                  : "Driver location live"}
              </p>
              {lastSeen && (
                <p className="text-muted text-[10px]">
                  Last update: {lastSeen}
                </p>
              )}
            </div>
            <span className="text-accent text-xs font-semibold">
              ~{order?.estimated_duration_mins} mins
            </span>
          </div>
        </div>
      )}

      {/* Bottom chips */}
      {order && stage !== "idle" && (
        <div
          className="absolute left-3 right-3 flex items-center justify-between pointer-events-none"
          style={{ bottom: chatAvailable ? "72px" : "12px", zIndex: 1000 }}
        >
          <div className="bg-surface/90 backdrop-blur rounded-xl px-3 py-2">
            <p className="text-muted text-[10px]">Waybill</p>
            <p className="text-accent text-xs font-bold">
              {order.waybill_number}
            </p>
          </div>
          <div className="bg-surface/90 backdrop-blur rounded-xl px-3 py-2">
            <p className="text-muted text-[10px]">Distance</p>
            <p className="text-light text-xs font-bold">
              {order.distance_km} km
            </p>
          </div>
        </div>
      )}

      {/* Chat button */}
      {chatAvailable && (
        <div className="absolute bottom-4 right-4" style={{ zIndex: 1001 }}>
          <button
            onClick={() => setShowChat(true)}
            className="w-12 h-12 bg-accent rounded-full flex items-center justify-center
              text-xl shadow-lg hover:bg-amber-400 transition-colors cursor-pointer"
          >
            💬
          </button>
        </div>
      )}

      {showChat && order && (
        <ChatWidget orderId={order.id} onClose={() => setShowChat(false)} />
      )}
    </div>
  );
}
