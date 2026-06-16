import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { DeliveryStage } from "../Dashboard";
import ChatWidget from "./ChatWidget";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DRIVER_ICON = L.divIcon({
  html: `<div style="background:#F5A623;width:40px;height:40px;border-radius:50%;
    border:3px solid white;display:flex;align-items:center;justify-content:center;
    font-size:20px;box-shadow:0 2px 10px rgba(0,0,0,0.4);">🚗</div>`,
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
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

export default function LiveMap({
  stage,
  order,
}: {
  stage: DeliveryStage;
  order: any;
}) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [wsDriverLocation, setWsDriverLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Init map once
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;

    const map = L.map(mapDivRef.current, {
      center: order ? [order.origin_lat, order.origin_lng] : [7.2571, 5.2058],
      zoom: order ? 8 : 7,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    mapRef.current = map;

    // Wait for map to be fully ready before allowing markers
    map.whenReady(() => {
      setMapReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  // Invalidate size after map is ready — container might not have final dimensions yet
  useEffect(() => {
    if (!mapReady) return;
    const timer = setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [mapReady]);

  // Add origin + destination markers when order exists
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !order || !mapReady) return;

    const origin: [number, number] = [order.origin_lat, order.origin_lng];
    const dest: [number, number] = [
      order.destination_lat,
      order.destination_lng,
    ];

    L.marker(origin, { icon: ORIGIN_ICON })
      .addTo(map)
      .bindPopup(`<b>📦 Pickup</b><br>${order.origin_park}`);

    L.marker(dest, { icon: DEST_ICON })
      .addTo(map)
      .bindPopup(`<b>🏁 Destination</b><br>${order.destination}`);

    if (routeLineRef.current) routeLineRef.current.remove();
    routeLineRef.current = L.polyline([origin, dest], {
      color: "#F5A623",
      weight: 3,
      opacity: 0.7,
      dashArray: "8, 8",
    }).addTo(map);

    map.fitBounds([origin, dest], { padding: [40, 40] });
  }, [order?.id, mapReady]);

  // WebSocket for live driver location
  useEffect(() => {
    if (stage !== "in-transit" || !order?.id) {
      wsRef.current?.close();
      wsRef.current = null;
      return;
    }

    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;
      console.log("Connecting tracking WS for order:", order.id);

      const ws = new WebSocket(
        `ws://147.182.208.195:8000/tracking/ws/${order.id}`,
      );
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Tracking WS connected ✅");
      };

      ws.onmessage = (e) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(e.data);
          console.log("Tracking data received:", data);
          if (data.type === "location") {
            setWsDriverLocation({ lat: data.lat, lng: data.lng });
            setLastSeen(new Date().toLocaleTimeString());
          }
        } catch {}
      };

      ws.onclose = () => {
        console.log("Tracking WS closed — reconnecting in 3s");
        if (isMounted) setTimeout(connect, 3000);
      };

      ws.onerror = () => ws.close();
    };

    const timer = setTimeout(connect, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [stage, order?.id]);

  // Update driver marker — waits for both mapReady and wsDriverLocation
  useEffect(() => {
    console.log("=== MARKER EFFECT ===");
    console.log("mapReady:", mapReady);
    console.log("wsDriverLocation:", wsDriverLocation);
    console.log("mapRef.current:", !!mapRef.current);

    if (!mapReady || !wsDriverLocation) {
      console.log("Skipping — missing dependency");
      return;
    }
    const map = mapRef.current;
    if (!map) {
      console.log("Skipping — no map");
      return;
    }

    const pos: [number, number] = [wsDriverLocation.lat, wsDriverLocation.lng];
    console.log("Adding/updating marker at:", pos);

    map.invalidateSize();

    if (driverMarkerRef.current) {
      console.log("Moving existing marker");
      driverMarkerRef.current.setLatLng(pos);
    } else {
      console.log("Creating NEW marker");
      driverMarkerRef.current = L.marker(pos, { icon: DRIVER_ICON }).addTo(map);
      console.log("Marker added to map:", driverMarkerRef.current);
    }

    // Also fit bounds to include driver location alongside origin/dest
    if (order) {
      const bounds = L.latLngBounds([
        pos,
        [order.origin_lat, order.origin_lng],
        [order.destination_lat, order.destination_lng],
      ]);
      map.fitBounds(bounds, { padding: [40, 40] });
      console.log("Map fitted to include driver");
    } else {
      map.setView(pos, 12);
    }
  }, [wsDriverLocation, mapReady]);

  const chatAvailable = order && ["matched", "in-transit"].includes(stage);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Map */}
      <div ref={mapDivRef} className="flex-1" style={{ minHeight: "300px" }} />

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
                Driver location live
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
                : "Driver matched — heading to pickup"}
            </p>
          </div>
        </div>
      )}

      {/* Bottom chips — waybill + distance */}
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

      {/* ChatWidget — fixed fullscreen overlay */}
      {showChat && order && (
        <ChatWidget orderId={order.id} onClose={() => setShowChat(false)} />
      )}
    </div>
  );
}
