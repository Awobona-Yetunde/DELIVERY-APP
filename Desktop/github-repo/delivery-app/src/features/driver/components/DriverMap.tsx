import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { DriverStatus, Order } from "../Dashboard";
import DriverChat from "./DriverChat";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const YOU_ICON = L.divIcon({
  html: `<div style="background:#F5A623;width:40px;height:40px;border-radius:50%;
    border:3px solid white;display:flex;align-items:center;justify-content:center;
    font-size:20px;box-shadow:0 2px 10px rgba(0,0,0,0.4);">🚗</div>`,
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const PICKUP_ICON = L.divIcon({
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

export default function DriverMap({
  status,
  activeRun,
  driverLocation,
}: {
  status: DriverStatus;
  activeRun: Order | null;
  driverLocation: { lat: number; lng: number } | null;
}) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [unread, setUnread] = useState(0);
  const [mapReady ] = useState(false);

  // Init map
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;
    mapRef.current = L.map(mapDivRef.current, {
      center: [7.2571, 5.2058],
      zoom: 10,
      zoomControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(mapRef.current);
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update driver marker as GPS moves
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !driverLocation) return;
    const pos: [number, number] = [driverLocation.lat, driverLocation.lng];
    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLatLng(pos);
    } else {
      driverMarkerRef.current = L.marker(pos, { icon: YOU_ICON })
        .addTo(map)
        .bindPopup("<b>📍 You are here</b>");
      map.setView(pos, 12);
    }
  }, [driverLocation]);

  // Add this effect in both map components
  useEffect(() => {
    if (!mapReady) return;
    const timer = setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [mapReady]);

  // Add pickup + destination + route when order accepted
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !activeRun) return;
    const origin: [number, number] = [
      activeRun.origin_lat,
      activeRun.origin_lng,
    ];
    const dest: [number, number] = [
      activeRun.destination_lat,
      activeRun.destination_lng,
    ];

    L.marker(origin, { icon: PICKUP_ICON })
      .addTo(map)
      .bindPopup(`<b>📦 Pickup</b><br>${activeRun.origin_park}`);
    L.marker(dest, { icon: DEST_ICON })
      .addTo(map)
      .bindPopup(`<b>🏁 Drop off</b><br>${activeRun.destination}`);

    if (routeLineRef.current) routeLineRef.current.remove();
    routeLineRef.current = L.polyline([origin, dest], {
      color: "#F5A623",
      weight: 3,
      opacity: 0.8,
      dashArray: "8, 8",
    }).addTo(map);

    const bounds = driverLocation
      ? ([[driverLocation.lat, driverLocation.lng], origin, dest] as [
          number,
          number,
        ][])
      : [origin, dest];
    map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [40, 40] });
  }, [activeRun?.id]);

  return (
    <div className="relative w-full h-full flex flex-col">
      <div
        ref={mapDivRef}
        style={{ width: "100%", height: "100%", minHeight: "400px" }}
      />

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
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
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
            <p className="text-accent text-sm font-bold shrink-0">
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

      {/* Chat button — outside map div so clicks work */}
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

      {/* DriverChat fixed overlay */}
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
