import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../../store/authStore";
import api from "../../lib/api";
import { startPolling } from "../../lib/polling";
import DriverStatusToggle from "./components/DriverStatusToggle";
import IncomingOrder from "./components/IncomingOrder";
import ActiveRun from "./components/ActiveRun";
import EarningsSummary from "./components/EarningsSummary";
import DriverMap from "./components/DriverMap";

export type DriverStatus = "offline" | "online" | "on-delivery";

export interface Order {
  id: string;
  waybill_number: string;
  package_description: string;
  package_size: string;
  package_weight: string;
  origin_park: string;
  destination: string;
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
  distance_km: number;
  estimated_duration_mins: number;
  price: number;
  vehicle_type: string;
  recipient_name: string;
  recipient_phone: string;
  status: string;
  route_risk: number;
  sender_name?: string; 
  sender_phone?: string;
}

const STORAGE_KEY = "driver-session";

function loadSession(): { status: DriverStatus; activeRun: Order | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { status: "offline", activeRun: null };
}

function saveSession(status: DriverStatus, activeRun: Order | null) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ status, activeRun }));
}

export default function DriverDashboard() {
  const user = useAuthStore((s) => s.user);

  const session = loadSession();
  const [status, setStatus] = useState<DriverStatus>(session.status);
  const [activeRun, setActiveRun] = useState<Order | null>(session.activeRun);
  const [incomingOrder, setIncomingOrder] = useState<Order | null>(null);
  const [seenOrderIds, setSeenOrderIds] = useState<Set<string>>(new Set());
  const [driverLocation, setDriverLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const stopPollingRef = useRef<(() => void) | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Persist status + activeRun whenever they change
  useEffect(() => {
    saveSession(status, activeRun);
  }, [status, activeRun]);

  // Sync active run from backend on mount
  useEffect(() => {
    const syncFromBackend = async () => {
      try {
        const { data } = await api.get("/orders/my");
        const orders: Order[] = Array.isArray(data)
          ? data
          : (data?.orders ?? []);

        const active = orders.find((o) =>
          ["accepted", "picked_up", "in_transit"].includes(o.status),
        );

        if (active) {
          setActiveRun(active);
          setStatus("on-delivery");
          saveSession("on-delivery", active);
        } else {
          // No active order — clear everything regardless of localStorage
          setActiveRun(null);
          setStatus("offline");
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        setActiveRun(null);
        setStatus("offline");
        localStorage.removeItem(STORAGE_KEY);
      }
    };
    syncFromBackend();
  }, []);

  // GPS watch
  useEffect(() => {
    if (!navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setDriverLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        console.log("GPS error:", err.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
    return () => {
      if (watchIdRef.current !== null)
        navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // Push location to backend when on delivery
  useEffect(() => {
    if (status !== "on-delivery" || !activeRun || !driverLocation) return;
    const stop = startPolling(async () => {
      if (!driverLocation) return;
      console.log("Pushing location:", driverLocation);
      try {
        await api.post("/tracking/update", {
          order_id: activeRun.id,
          latitude: driverLocation.lat,
          longitude: driverLocation.lng,
          accuracy: 10,
          timestamp: Math.floor(Date.now() / 1000),
        });
        console.log("Location pushed ✅");
      } catch (err) {
        console.log("Location push failed ❌", err);
      }
    }, 15000);
    return () => stop();
  }, [status, activeRun?.id, driverLocation]);

  // Poll for available orders when online
  useEffect(() => {
    if (status !== "online") {
      stopPollingRef.current?.();
      stopPollingRef.current = null;
      setIncomingOrder(null);
      return;
    }

    const stop = startPolling(async () => {
      const { data } = await api.get("/orders/available");
      const orders: Order[] = Array.isArray(data) ? data : (data?.orders ?? []);
      const next = orders.find((o) => !seenOrderIds.has(o.id));
      if (next) setIncomingOrder(next);
    }, 5000);

    stopPollingRef.current = stop;
    return () => stop();
  }, [status, seenOrderIds]);

  const handleAccept = async (order: Order) => {
    try {
      await api.patch(`/orders/${order.id}/status`, { status: "accepted" });
      setIncomingOrder(null);
      setActiveRun(order);
      setStatus("on-delivery");
      setSeenOrderIds((prev) => new Set([...prev, order.id]));
    } catch {}
  };

  const handleReject = (order: Order) => {
    setSeenOrderIds((prev) => new Set([...prev, order.id]));
    setIncomingOrder(null);
  };

  const handleDeliveryComplete = () => {
    setActiveRun(null);
    setStatus("online");
    setSeenOrderIds(new Set());
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleToggle = () => {
    if (status === "offline") setStatus("online");
    else if (status === "online") setStatus("offline");
  };

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "DR";

  return (
    <>
      {/* Main layout */}
      <div className="min-h-screen bg-surface flex flex-col">
        {/* Nav */}
        <nav className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-sm">
              📦
            </div>
            <span className="text-light font-semibold text-lg">SendRun</span>
            <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/60 text-muted">
              Driver
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-semibold">
              {initials}
            </div>
            <div className="hidden sm:block">
              <p className="text-light text-sm font-medium">
                {user ? `${user.firstName} ${user.lastName}` : "Driver"}
              </p>
              <p className="text-muted text-xs">
                {status === "offline"
                  ? "⚫ Offline"
                  : status === "online"
                    ? "🟢 Online"
                    : "🟡 On delivery"}
              </p>
            </div>
          </div>
        </nav>

        {/* Body */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left panel */}
          <div className="lg:w-[400px] flex-shrink-0 overflow-y-auto border-r border-white/5 p-5 space-y-5">
            <DriverStatusToggle status={status} onToggle={handleToggle} />
            <EarningsSummary status={status} />

            {activeRun && (
              <ActiveRun
                order={activeRun}
                onComplete={handleDeliveryComplete}
              />
            )}

            {status === "online" && !activeRun && (
              <div className="text-center py-10">
                <div className="text-5xl mb-4 animate-pulse">📡</div>
                <p className="text-light font-medium">Waiting for orders...</p>
                <p className="text-muted text-xs mt-2 leading-relaxed">
                  Stay online and keep your phone close.
                  <br />
                  Orders appear automatically.
                </p>
              </div>
            )}

            {status === "offline" && !activeRun && (
              <div className="text-center py-10">
                <div className="text-5xl mb-4 opacity-40">🚗</div>
                <p className="text-light font-medium">You're offline</p>
                <p className="text-muted text-xs mt-2">
                  Go online to start receiving delivery requests.
                </p>
              </div>
            )}
          </div>

          {/* Right panel — map */}
          <div className="flex-1 relative min-h-[400px] lg:min-h-0">
            <DriverMap
              status={status}
              activeRun={activeRun}
              driverLocation={driverLocation}
            />
          </div>
        </div>
      </div>

      {/* Incoming order — rendered OUTSIDE layout so nothing overlaps it */}
      {incomingOrder && (
        <div className="fixed inset-0 z-[9999]">
          <IncomingOrder
            order={incomingOrder}
            onAccept={handleAccept}
            onReject={handleReject}
          />
        </div>
      )}
    </>
  );
}
