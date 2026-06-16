const STATUS_STYLES: Record<string, { color: string; icon: string }> = {
  pending: { color: "text-amber-400", icon: "🔍" },
  accepted: { color: "text-blue-400", icon: "✅" },
  picked_up: { color: "text-blue-400", icon: "📦" },
  in_transit: { color: "text-blue-400", icon: "🚗" },
  delivered: { color: "text-green-400", icon: "🎉" },
  cancelled: { color: "text-red-400", icon: "❌" },
};

export default function RecentOrders({ orders }: { orders: any[] }) {
  if (orders.length === 0) return null;

  return (
    <div className="border-t border-white/5 px-5 py-4 max-h-[240px] overflow-y-auto">
      <p className="text-muted text-xs font-semibold uppercase tracking-wide mb-3">
        Your deliveries
      </p>
      <div className="space-y-2">
        {orders.map((o) => {
          const style = STATUS_STYLES[o.status] ?? {
            color: "text-muted",
            icon: "📦",
          };
          return (
            <div
              key={o.id}
              className="flex items-center gap-3 bg-primary/20 rounded-xl px-4 py-3"
            >
              <span className="text-base">{style.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-light text-xs font-medium truncate">
                  {o.origin_park} → {o.destination}
                </p>
                <p className="text-muted text-[10px]">
                  {o.waybill_number} ·{" "}
                  {new Date(o.created_at).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-accent text-xs font-semibold">
                  ₦
                  {o.price?.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <p
                  className={`text-[10px] font-medium capitalize ${style.color}`}
                >
                  {o.status.replace(/_/g, " ")}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
