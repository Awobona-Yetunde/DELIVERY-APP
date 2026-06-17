import { useEffect, useRef, useState } from "react";
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
import { WS_URL } from "../../../lib/config";


// Fix default marker icons
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
  html: `<div style="background:#1A3C2E;width:32px;height:32px;border-radius:50%;
    border:3px solid #F5A623;display:flex;align-items:center;justify-content:center;
    font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3);">📦</div>`,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const DEST_ICON = L.divIcon({
  html: `<div style="background:#0D1F17;width:32px;height:32px;border-radius:50%;
    border:3px solid white;display:flex;align-items:center;justify-content:center;
    font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🏁</div>`,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Helper component to fit map bounds
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [points, map]);
  return null;
}

// Helper component to pan map to a point
function PanTo({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.panTo(position);
  }, [position, map]);
  return null;
}

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
  const [showChat, setShowChat] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [driverPos, setDriverPos] = useState<string | null>(null);

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

      const ws = new WebSocket(
        `${WS_URL}/tracking/ws/${order.id}`,
      );
      wsRef.current = ws;

      ws.onopen = () => console.log("Tracking WS connected ✅");

      ws.onmessage = (e) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(e.data);
          if (data.type !== "location") return;
          console.log("Driver at:", data.lat, data.lng);
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

  // Build the list of all points for fitting bounds
  const allPoints: [number, number][] = [];
  if (order) {
    allPoints.push([order.origin_lat, order.origin_lng]);
    allPoints.push([order.destination_lat, order.destination_lng]);
  }
  if (driverLocation) {
    allPoints.push([driverLocation.lat, driverLocation.lng]);
  }

  const center: [number, number] = order
    ? [order.origin_lat, order.origin_lng]
    : [7.2571, 5.2058];

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Map — react-leaflet handles lifecycle properly */}
      <div className="flex-1" style={{ minHeight: "300px" }}>
        <MapContainer
          center={center}
          zoom={order ? 8 : 7}
          style={{ width: "100%", height: "100%" }}
          zoomControl={true}
        >
          <TileLayer
            attribution="© OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Origin marker */}
          {order && (
            <Marker
              position={[order.origin_lat, order.origin_lng]}
              icon={ORIGIN_ICON}
            >
              <Popup>
                <b>📦 Pickup</b>
                <br />
                {order.origin_park}
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
                <b>🏁 Destination</b>
                <br />
                {order.destination}
              </Popup>
            </Marker>
          )}

          {/* DRIVER MARKER — React component, renders/updates automatically */}
          {driverLocation && (
            <Marker
              position={[driverLocation.lat, driverLocation.lng]}
              icon={DRIVER_ICON}
              zIndexOffset={1000}
            >
              <Popup>
                <b>🚗 Your driver</b>
                <br />
                Live location
              </Popup>
            </Marker>
          )}

          {/* Route line */}
          {order && (
            <Polyline
              positions={[
                [order.origin_lat, order.origin_lng],
                [order.destination_lat, order.destination_lng],
              ]}
              pathOptions={{
                color: "#F5A623",
                weight: 3,
                opacity: 0.7,
                dashArray: "8, 8",
              }}
            />
          )}

          {/* Fit bounds to show all points */}
          {allPoints.length >= 2 && <FitBounds points={allPoints} />}

          {/* Pan to driver when location updates */}
          {driverLocation && (
            <PanTo position={[driverLocation.lat, driverLocation.lng]} />
          )}
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

      {/* Searching / matched chip */}
      {(stage === "searching" || stage === "matched") && order && (
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
      {stage === "in-transit" && (
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
