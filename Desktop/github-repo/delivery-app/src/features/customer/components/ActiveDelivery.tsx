import { useState } from "react";
import type { DeliveryStage } from "../Dashboard";
import ChatWidget from "./ChatWidget";



const STAGES: { key: DeliveryStage; label: string; icon: string }[] = [
  { key: "searching", label: "Finding driver", icon: "🔍" },
  { key: "matched", label: "Driver matched", icon: "✅" },
  { key: "in-transit", label: "In transit", icon: "🚗" },
  { key: "delivered", label: "Delivered", icon: "🎉" },
];

export default function ActiveDelivery({
  stage,
  order,
  onCancel,
}: {
  stage: DeliveryStage;
  order: any;
  onCancel: () => void;
}) {
  const [showChat, setShowChat] = useState(false);
  const currentIndex = STAGES.findIndex((s) => s.key === stage);

  return (
    <div className="p-5 space-y-4">
      {/* Stage tracker */}
      <div className="bg-primary/30 rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`text-3xl ${stage === "searching" ? "animate-pulse" : ""}`}
          >
            {STAGES[currentIndex]?.icon}
          </div>
          <div>
            <p className="text-light font-semibold">
              {STAGES[currentIndex]?.label}
            </p>
            <p className="text-muted text-xs">
              {order.origin_park} → {order.destination}
            </p>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-1">
          {STAGES.map((s, i) => (
            <div key={s.key} className="flex items-center flex-1">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0
                ${i <= currentIndex ? "bg-accent text-surface" : "bg-white/10 text-muted"}`}
              >
                {i < currentIndex ? "✓" : i + 1}
              </div>
              {i < STAGES.length - 1 && (
                <div
                  className={`flex-1 h-px mx-1 ${i < currentIndex ? "bg-accent" : "bg-white/10"}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SEARCHING — spinning */}
      {stage === "searching" && (
        <div className="text-center py-8">
          <div
            className="w-16 h-16 rounded-full border-4 border-accent border-t-transparent
            animate-spin mx-auto mb-4"
          />
          <p className="text-light font-semibold">Looking for a driver...</p>
          <p className="text-muted text-xs mt-2 leading-relaxed">
            Hang tight. A driver will accept your request shortly.
          </p>
          <div className="mt-4 bg-primary/30 rounded-xl px-4 py-3 text-left space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted">Waybill</span>
              <span className="text-accent font-semibold">
                {order.waybill_number}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">Route</span>
              <span className="text-light">
                {order.origin_park} → {order.destination}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">Distance</span>
              <span className="text-light">{order.distance_km} km</span>
            </div>
          </div>
        </div>
      )}

      {/* MATCHED / IN-TRANSIT — price + driver card */}
      {(stage === "matched" || stage === "in-transit") && (
        <>
          {/* Price card */}
          <div className="bg-primary/40 border border-accent/30 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted text-[10px] uppercase tracking-wide font-semibold">
                  Delivery price
                </p>
                <p className="text-accent text-3xl font-bold mt-0.5">
                  ₦
                  {order.price?.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-muted text-[10px]">Est. time</p>
                <p className="text-light text-sm font-semibold mt-0.5">
                  ~{order.estimated_duration_mins} mins
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                { label: "Distance", value: `${order.distance_km} km` },
                { label: "Risk level", value: `${order.route_risk}/5` },
                {
                  label: "Vehicle",
                  value: order.vehicle_type?.replace(/_/g, " "),
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-primary/30 rounded-lg px-2 py-2 text-center"
                >
                  <p className="text-light text-xs font-semibold capitalize">
                    {s.value}
                  </p>
                  <p className="text-muted text-[10px]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Driver card */}
          <div className="bg-primary/30 rounded-2xl p-4">
            <p className="text-muted text-xs font-semibold uppercase tracking-wide mb-3">
              Your driver
            </p>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-xl flex-shrink-0">
                👨🏾‍✈️
              </div>
              <div className="flex-1">
                <p className="text-light font-semibold">
                  {order.driver_name ?? "Driver assigned"}
                </p>
                {order.driver_phone && (
                  <p className="text-muted text-xs mt-0.5">
                    {order.driver_phone}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span
                      key={i}
                      className={`text-xs ${i <= 4 ? "text-accent" : "text-muted"}`}
                    >
                      ★
                    </span>
                  ))}
                  <span className="text-muted text-xs ml-1">4.8</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-light text-xs font-medium capitalize">
                  {order.vehicle_type?.replace(/_/g, " ")}
                </p>
                <p
                  className={`text-xs font-medium mt-0.5
                  ${stage === "in-transit" ? "text-green-400" : "text-accent"}`}
                >
                  {stage === "in-transit" ? "🚗 On the way" : "✅ Accepted"}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              {/* Call driver — uses driver_phone if available */}
              {order.driver_phone ? (
                <a
                  href={`tel:${order.driver_phone}`}
                  className="flex-1 h-9 bg-accent/10 border border-accent/20 text-accent text-xs
                    font-medium rounded-xl hover:bg-accent/20 transition-colors cursor-pointer
                    flex items-center justify-center gap-1"
                >
                  📞 Call driver
                </a>
              ) : (
                <button
                  disabled
                  className="flex-1 h-9 bg-accent/10 border border-accent/20 text-accent/40 text-xs
                    font-medium rounded-xl flex items-center justify-center gap-1 cursor-not-allowed"
                >
                  📞 Call driver
                </button>
              )}

              {/* Message button — opens chat */}
              <button
                onClick={() => setShowChat(true)}
                className="flex-1 h-9 bg-white/5 border border-white/10 text-light text-xs
                  font-medium rounded-xl hover:bg-white/10 transition-colors cursor-pointer
                  flex items-center justify-center gap-1"
              >
                💬 Message
              </button>
            </div>
          </div>
        </>
      )}

      {/* Order summary */}
      {stage !== "searching" && (
        <div className="bg-primary/20 rounded-xl px-4 py-3 space-y-2">
          <p className="text-muted text-[10px] uppercase tracking-wide font-semibold mb-1">
            Order summary
          </p>
          {[
            { label: "Package", value: order.package_description },
            { label: "Size", value: order.package_size?.replace(/_/g, " ") },
            {
              label: "Weight",
              value: order.package_weight?.replace(/_/g, " "),
            },
            { label: "Recipient", value: order.recipient_name },
            { label: "Phone", value: order.recipient_phone },
          ].map((row) => (
            <div key={row.label} className="flex justify-between text-xs">
              <span className="text-muted">{row.label}</span>
              <span className="text-light font-medium capitalize">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Delivered state */}
      {stage === "delivered" && (
        <div className="text-center py-4">
          <div className="text-5xl mb-3">🎉</div>
          <p className="text-light font-semibold">Package delivered!</p>
          <p className="text-muted text-xs mt-1">
            Your package reached {order.destination}
          </p>
          <p className="text-accent font-bold text-2xl mt-3">
            ₦
            {order.price?.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </p>
          <button
            onClick={onCancel}
            className="mt-5 w-full h-11 bg-accent text-surface font-semibold rounded-xl
              text-sm cursor-pointer hover:bg-amber-400 transition-colors"
          >
            Send another package
          </button>
        </div>
      )}

      {/* Cancel — only when searching */}
      {stage === "searching" && (
        <button
          onClick={onCancel}
          className="w-full h-11 bg-red-500/20 border border-red-500/40 text-red-400
            font-bold rounded-xl text-sm hover:bg-red-500/30 transition-colors cursor-pointer"
        >
          Cancel booking
        </button>
      )}

      {/* Chat widget */}
      {showChat && order?.id && (
        <ChatWidget orderId={order.id} onClose={() => setShowChat(false)} />
      )}
    </div>
  );
}