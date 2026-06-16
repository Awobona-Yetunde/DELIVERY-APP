import type { DriverStatus } from "../Dashboard";

export default function EarningsSummary({ status }: { status: DriverStatus }) {
  return (
    <div className="bg-primary/20 rounded-2xl p-4">
      <p className="text-muted text-xs font-semibold uppercase tracking-wide mb-3">
        Today's summary
      </p>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Earned", value: "₦9,600", icon: "💰" },
          { label: "Trips", value: "2", icon: "🚗" },
          { label: "km driven", value: "558", icon: "📍" },
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

      {status === "online" && (
        <div className="mt-3 flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <p className="text-green-400 text-xs">
            Online · waiting for new orders
          </p>
        </div>
      )}
    </div>
  );
}
