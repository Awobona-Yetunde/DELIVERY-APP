import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import api from "../../lib/api";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface DashboardStats {
  total_orders: number;
  pending_orders: number;
  in_transit_orders: number;
  delivered_orders: number;
  total_senders: number;
  total_drivers: number;
  verified_drivers: number;
  average_predicted_price: number;
  total_revenue_predicted: number;
  model_accuracy: Record<string, any>;
}

interface VolumeEntry {
  date: string;
  count: number;
}

interface RouteEntry {
  origin: string;
  destination: string;
  order_count: number;
  avg_price: number;
}

const COLORS = ["#F5A623", "#1A3C2E", "#8A9E95", "#F2EDE4"];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [volume, setVolume] = useState<VolumeEntry[]>([]);
  const [routes, setRoutes] = useState<RouteEntry[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError("");
      try {
        const [statsRes, volumeRes, routesRes] = await Promise.all([
          api.get("/admin/dashboard"),
          api.get("/admin/order-volume", { params: { days } }),
          api.get("/admin/route-activity"),
        ]);
        setStats(statsRes.data);
        const vol = Array.isArray(volumeRes.data)
          ? volumeRes.data
          : (volumeRes.data?.data ?? []);
        setVolume(vol);
        const rt = Array.isArray(routesRes.data)
          ? routesRes.data
          : (routesRes.data?.data ?? []);
        setRoutes(rt);
      } catch {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [days]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const orderPieData = stats
    ? [
        { name: "Pending", value: stats.pending_orders },
        { name: "In Transit", value: stats.in_transit_orders },
        { name: "Delivered", value: stats.delivered_orders },
      ]
    : [];

  const driverPieData = stats
    ? [
        { name: "Verified", value: stats.verified_drivers },
        {
          name: "Unverified",
          value: stats.total_drivers - stats.verified_drivers,
        },
      ]
    : [];

  const modelAccuracyEntries = stats?.model_accuracy
    ? Object.entries(stats.model_accuracy).map(([key, val]) => ({
        name: key.replace(/_/g, " "),
        value: typeof val === "number" ? Number(val.toFixed(4)) : 0,
      }))
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted text-sm">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center text-lg">
            📦
          </div>
          <div>
            <span className="text-light font-semibold text-lg">SendRun</span>
            <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
              Admin
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-muted text-sm hidden sm:block">
            {user?.firstName} {user?.lastName}
          </p>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl border border-white/10 text-muted text-xs
              hover:text-light hover:border-white/20 transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </nav>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 max-w-7xl mx-auto w-full">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-light text-2xl font-bold">Dashboard</h1>
            <p className="text-muted text-sm mt-0.5">
              Real-time overview of SendRun operations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted text-xs">Order volume:</span>
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer
                  ${
                    days === d
                      ? "bg-accent text-surface"
                      : "bg-primary/30 text-muted hover:text-light"
                  }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {/* Stat cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              {
                label: "Total orders",
                value: stats.total_orders,
                icon: "📦",
                color: "text-accent",
              },
              {
                label: "Pending",
                value: stats.pending_orders,
                icon: "🔍",
                color: "text-amber-400",
              },
              {
                label: "In transit",
                value: stats.in_transit_orders,
                icon: "🚗",
                color: "text-blue-400",
              },
              {
                label: "Delivered",
                value: stats.delivered_orders,
                icon: "✅",
                color: "text-green-400",
              },
              {
                label: "Total senders",
                value: stats.total_senders,
                icon: "🙋",
                color: "text-light",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-primary/20 border border-white/5 rounded-2xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">{s.icon}</span>
                </div>
                <p className={`text-2xl font-bold ${s.color}`}>
                  {s.value.toLocaleString()}
                </p>
                <p className="text-muted text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Second row stat cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: "Total drivers",
                value: stats.total_drivers,
                icon: "🚗",
                suffix: "",
              },
              {
                label: "Verified drivers",
                value: stats.verified_drivers,
                icon: "✅",
                suffix: "",
              },
              {
                label: "Avg. predicted price",
                value: `₦${stats.average_predicted_price?.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
                icon: "💰",
                suffix: "",
              },
              {
                label: "Total predicted revenue",
                value: `₦${stats.total_revenue_predicted?.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
                icon: "📈",
                suffix: "",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-primary/20 border border-white/5 rounded-2xl p-4"
              >
                <span className="text-xl">{s.icon}</span>
                <p className="text-accent text-xl font-bold mt-2">{s.value}</p>
                <p className="text-muted text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Order volume area chart */}
          <div className="lg:col-span-2 bg-primary/20 border border-white/5 rounded-2xl p-5">
            <h3 className="text-light text-sm font-semibold mb-4">
              Order volume — last {days} days
            </h3>
            {volume.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={volume}>
                  <defs>
                    <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F5A623" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F5A623" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#8A9E95"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => v?.slice(5)}
                  />
                  <YAxis stroke="#8A9E95" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      background: "#0D1F17",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "#F2EDE4",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#F5A623"
                    strokeWidth={2}
                    fill="url(#volumeGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center">
                <p className="text-muted text-sm">No volume data yet</p>
              </div>
            )}
          </div>

          {/* Order status pie */}
          <div className="bg-primary/20 border border-white/5 rounded-2xl p-5">
            <h3 className="text-light text-sm font-semibold mb-4">
              Order status
            </h3>
            {orderPieData.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={orderPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {orderPieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#0D1F17",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "#F2EDE4",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    formatter={(value) => (
                      <span style={{ color: "#8A9E95", fontSize: "11px" }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center">
                <p className="text-muted text-sm">No orders yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Route activity + driver verification */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Route activity bar chart */}
          <div className="lg:col-span-2 bg-primary/20 border border-white/5 rounded-2xl p-5">
            <h3 className="text-light text-sm font-semibold mb-4">
              Top routes by order count
            </h3>
            {routes.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={routes.slice(0, 8)} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    type="number"
                    stroke="#8A9E95"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="origin"
                    stroke="#8A9E95"
                    tick={{ fontSize: 9 }}
                    width={80}
                    tickFormatter={(v) =>
                      v?.length > 10 ? v.slice(0, 10) + "…" : v
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0D1F17",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "#F2EDE4",
                      fontSize: "12px",
                    }}
                    formatter={(val: any, name: string) => [
                      name === "order_count"
                        ? val
                        : `₦${Number(val).toLocaleString()}`,
                      name === "order_count" ? "Orders" : "Avg price",
                    ]}
                  />
                  <Bar
                    dataKey="order_count"
                    fill="#F5A623"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center">
                <p className="text-muted text-sm">No route data yet</p>
              </div>
            )}
          </div>

          {/* Driver verification pie + model accuracy */}
          <div className="space-y-4">
            <div className="bg-primary/20 border border-white/5 rounded-2xl p-5">
              <h3 className="text-light text-sm font-semibold mb-3">
                Driver verification
              </h3>
              {driverPieData.some((d) => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={driverPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      <Cell fill="#F5A623" />
                      <Cell fill="#1A3C2E" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#0D1F17",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        color: "#F2EDE4",
                        fontSize: "12px",
                      }}
                    />
                    <Legend
                      formatter={(value) => (
                        <span style={{ color: "#8A9E95", fontSize: "10px" }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted text-xs text-center py-6">
                  No drivers yet
                </p>
              )}
            </div>

            {/* Model accuracy */}
            <div className="bg-primary/20 border border-white/5 rounded-2xl p-5">
              <h3 className="text-light text-sm font-semibold mb-3">
                🤖 Model accuracy
              </h3>
              {modelAccuracyEntries.length > 0 ? (
                <div className="space-y-2">
                  {modelAccuracyEntries.map((entry) => (
                    <div key={entry.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted capitalize">
                          {entry.name}
                        </span>
                        <span className="text-accent font-semibold">
                          {entry.value}
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full"
                          style={{
                            width: `${Math.min(entry.value * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-xs text-center py-2">
                  No model data yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Route activity table */}
        {routes.length > 0 && (
          <div className="bg-primary/20 border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h3 className="text-light text-sm font-semibold">
                All route activity
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {["Origin", "Destination", "Orders", "Avg. Price"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left px-5 py-3 text-muted text-xs font-semibold uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {routes.map((r, i) => (
                    <tr
                      key={i}
                      className="border-b border-white/5 hover:bg-white/2 transition-colors"
                    >
                      <td className="px-5 py-3 text-light text-sm">
                        {r.origin}
                      </td>
                      <td className="px-5 py-3 text-light text-sm">
                        {r.destination}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-accent font-semibold text-sm">
                          {r.order_count}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-light text-sm">
                        ₦
                        {r.avg_price?.toLocaleString("en-NG", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
