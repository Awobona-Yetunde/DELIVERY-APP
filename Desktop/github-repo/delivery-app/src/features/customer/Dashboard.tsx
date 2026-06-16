import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import api from "../../lib/api";
import { startPolling } from "../../lib/polling";
import BookingPanel from "./components/BookingPanel";
import ActiveDelivery from "./components/ActiveDelivery";
import RecentOrders from "./components/RecentOrders";
import LiveMap from "./components/LiveMap";

export type DeliveryStage =
  | "idle"
  | "searching"
  | "matched"
  | "in-transit"
  | "delivered";

const STATUS_TO_STAGE: Record<string, DeliveryStage> = {
  pending: "searching",
  accepted: "matched",
  picked_up: "in-transit",
  in_transit: "in-transit",
  delivered: "delivered",
};

export default function CustomerDashboard() {
  const user = useAuthStore((s) => s.user);
  const [stage, setStage] = useState<DeliveryStage>("idle");
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);


  // On mount — fetch customer orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get("/orders/my");
        const orders: any[] = Array.isArray(data) ? data : (data?.orders ?? []);
        orders.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        setRecentOrders(orders);
        const latest = orders[0];
        if (
          latest &&
          latest.status !== "delivered" &&
          latest.status !== "cancelled"
        ) {
          setActiveOrder(latest);
          setStage(STATUS_TO_STAGE[latest.status] ?? "searching");
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);



  // Poll order status when active
  useEffect(() => {
    if (!activeOrder || stage === "idle" || stage === "delivered") return;

    const stop = startPolling(async () => {
      const { data } = await api.get(`/orders/${activeOrder.id}`);
      const newStage = STATUS_TO_STAGE[data.status];
      if (newStage) setStage(newStage);

      // This triggers the driver fetch effect when driver_id appears
      setActiveOrder(data);

      if (data.status === "delivered") {
        const { data: allOrders } = await api.get("/orders/my");
        const orders = Array.isArray(allOrders)
          ? allOrders
          : (allOrders?.orders ?? []);
        setRecentOrders(
          orders.sort(
            (a: any, b: any) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          ),
        );
      }
    }, 8000);

    return () => stop();
  }, [activeOrder?.id, stage]);



  const handleBook = (order: any) => {
    setActiveOrder(order);
    setStage("searching");
    setRecentOrders((prev) => [order, ...prev]);
  };

  const handleCancel = () => {
    setStage("idle");
    setActiveOrder(null);
  };

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "ME";

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted text-sm">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-sm">
            📦
          </div>
          <span className="text-light font-semibold text-lg">SendRun</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-light text-xs font-semibold">
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-light text-sm font-medium">
              {user ? `${user.firstName} ${user.lastName}` : "Customer"}
            </p>
            <p className="text-muted text-xs">Sender</p>
          </div>
        </div>
      </nav>

      {/* Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left panel — fixed width, scrollable */}
        <div className="lg:w-[420px] shrink-0 overflow-y-auto border-r border-white/5">
          {stage === "idle" ? (
            <BookingPanel onBook={handleBook} />
          ) : (
            <ActiveDelivery
              stage={stage}
              order={activeOrder}
              onStageChange={setStage}
              onCancel={handleCancel}
            />
          )}
        </div>

        {/* Right panel — map fills remaining space */}
        <div className="flex-1 flex flex-col min-h-[400px] lg:min-h-0">
          <div className="flex-1 relative">
            <LiveMap
              stage={stage}
              order={activeOrder}
            />
          </div>

          {/* Recent orders strip below map when idle */}
          {stage === "idle" && recentOrders.length > 0 && (
            <RecentOrders orders={recentOrders} />
          )}
        </div>
      </div>
    </div>
  );
}
