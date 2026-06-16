import { useState, useEffect } from "react";
import type { Order } from "../Dashboard";

export default function IncomingOrder({
  order,
  onAccept,
  onReject,
}: {
  order: Order;
  onAccept: (o: Order) => void;
  onReject: (o: Order) => void;
}) {
  const [countdown, setCountdown] = useState(20);

  useEffect(() => {
    setCountdown(20);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onReject(order);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [order.id]);

  const progress = (countdown / 20) * 100;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" />

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl px-5 pt-5 pb-8 shadow-2xl max-w-lg mx-auto">
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>

        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

        {/* Header + countdown */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-light font-semibold text-lg">New order!</p>
            <p className="text-muted text-xs">
              Accept before the timer runs out
            </p>
          </div>
          <div className="relative w-14 h-14 flex-shrink-0">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="4"
              />
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                stroke="#F5A623"
                strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 24}`}
                strokeDashoffset={`${2 * Math.PI * 24 * (1 - progress / 100)}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-accent font-bold text-sm">
              {countdown}
            </span>
          </div>
        </div>

        {/* Route */}
        <div className="bg-primary/40 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-accent" />
              <div className="w-px h-7 bg-muted/30" />
              <div className="w-2.5 h-2.5 rounded-full border-2 border-light" />
            </div>
            <div className="flex-1">
              <p className="text-light text-sm font-medium">
                {order.origin_park}
              </p>
              <p className="text-muted text-xs my-1">Pick up package at park</p>
              <p className="text-light text-sm font-medium">
                {order.destination}
              </p>
            </div>
            <div className="text-right">
              <p className="text-accent text-xl font-bold">
                ₦{order.price?.toLocaleString()}
              </p>
              <p className="text-muted text-xs">
                ~{order.estimated_duration_mins} mins
              </p>
              <p className="text-muted text-xs">{order.distance_km} km</p>
            </div>
          </div>
        </div>

        {/* Package details */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "Size", value: order.package_size, icon: "📦" },
            { label: "Weight", value: order.package_weight, icon: "⚖️" },
            { label: "Vehicle", value: order.vehicle_type, icon: "🚗" },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-primary/30 rounded-xl px-3 py-2.5 text-center"
            >
              <span className="text-lg">{item.icon}</span>
              <p className="text-light text-xs font-medium mt-1 capitalize">
                {item.value?.replace(/_/g, " ")}
              </p>
              <p className="text-muted text-[10px]">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="bg-primary/20 rounded-xl px-3 py-2.5 mb-4">
          <p className="text-muted text-[10px] uppercase tracking-wide font-semibold mb-1">
            Package description
          </p>
          <p className="text-light text-xs">{order.package_description}</p>
        </div>

        {/* Waybill + recipient */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-muted text-xs">
            Waybill:{" "}
            <span className="text-accent font-medium">
              {order.waybill_number}
            </span>
          </p>
          <p className="text-muted text-xs">
            Recipient:{" "}
            <span className="text-light font-medium">
              {order.recipient_name}
            </span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => onReject(order)}
            className="flex-1 border border-white/10 rounded-2xl text-muted text-sm
              font-semibold hover:bg-white/5 transition-colors cursor-pointer py-3"
          >
            Reject
          </button>
          <button
            onClick={() => onAccept(order)}
            className="flex-[2] bg-accent text-surface rounded-2xl text-sm
              font-bold hover:bg-amber-400 transition-colors cursor-pointer py-3
              flex items-center justify-center gap-2"
          >
            🚀 Accept · ₦{order.price?.toLocaleString()}
          </button>
        </div>
      </div>
    </>
  );
}
