import { useState, useEffect } from "react";
import type { DriverStatus } from "../Dashboard";
import api from "../../../lib/api";

interface TodayStats {
  earned: number;
  trips: number;
  distance: number;
}

export default function EarningsSummary({ status }: { status: DriverStatus }) {
  const [stats, setStats] = useState<TodayStats>({
    earned: 0,
    trips: 0,
    distance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get("/orders/my");
        const orders: any[] = Array.isArray(data) ? data : (data?.orders ?? []);

        // Filter today's orders
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];

        const todayOrders = orders.filter((o) => {
          const created = o.created_at?.split("T")[0];
          return created === todayStr;
        });

        const delivered = todayOrders.filter((o) => o.status === "delivered");

        const earned = delivered.reduce(
          (sum: number, o: any) => sum + (o.price ?? 0),
          0,
        );
        const distance = delivered.reduce(
          (sum: number, o: any) => sum + (o.distance_km ?? 0),
          0,
        );

        setStats({
          earned,
          trips: delivered.length,
          distance: Math.round(distance),
        });
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchStats();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-primary/20 rounded-2xl p-4">
      <p className="text-muted text-xs font-semibold uppercase tracking-wide mb-3">
        Today's summary
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <span className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              label: "Earned",
              value: `₦${stats.earned.toLocaleString("en-NG")}`,
              icon: "💰",
            },
            { label: "Trips", value: String(stats.trips), icon: "🚗" },
            { label: "km driven", value: String(stats.distance), icon: "📍" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-primary/30 rounded-xl px-2 py-3 text-center"
            >
              <span className="text-base">{stat.icon}</span>
              <p className="text-light text-sm font-bold mt-1">{stat.value}</p>
              <p className="text-muted text-[10px]">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {status === "online" && (
        <div className="mt-3 flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <p className="text-green-400 text-xs">
            Online — waiting for new orders
          </p>
        </div>
      )}

      {status === "on-delivery" && (
        <div className="mt-3 flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-xl px-3 py-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <p className="text-accent text-xs">
            On delivery — stats update after completion
          </p>
        </div>
      )}
    </div>
  );
}
