import { useState, useEffect } from "react";
import api from "../../../lib/api";
import type { Order } from "../Dashboard";

type RunStage = "collect" | "start-delivery" | "deliver";

const RUN_STAGES: {
  key: RunStage;
  label: string;
  sub: string;
  icon: string;
  apiStatus: string;
  buttonText: string;
}[] = [
  {
    key: "collect",
    label: "Collect package",
    sub: "Go to the park and collect the package",
    icon: "📦",
    apiStatus: "picked_up",
    buttonText: "📦 Confirm package collected",
  },
  {
    key: "start-delivery",
    label: "Start delivery",
    sub: "Begin your trip to the destination",
    icon: "🚗",
    apiStatus: "in_transit",
    buttonText: "🚗 Start delivery",
  },
  {
    key: "deliver",
    label: "Deliver package",
    sub: "Hand the package to the recipient",
    icon: "🎉",
    apiStatus: "delivered",
    buttonText: "🎉 Mark as delivered",
  },
];

function getInitialStage(status: string): RunStage {
  if (status === "picked_up") return "start-delivery";
  if (status === "in_transit") return "deliver";
  return "collect"; // accepted → first step
}

function PhoneModal({
  name,
  phone,
  onClose,
}: {
  name: string;
  phone: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-4"
      style={{ zIndex: 99999 }}
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-surface border border-white/10 rounded-2xl w-full max-w-xs p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/5 flex items-center
            justify-center text-muted hover:text-light cursor-pointer text-lg leading-none"
        >
          ×
        </button>
        <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center text-2xl mx-auto mb-4">
          🙋
        </div>
        <p className="text-light font-semibold text-center text-base mb-1">
          {name}
        </p>
        <p className="text-muted text-xs text-center mb-5">Customer</p>
        <div className="flex items-center gap-3 bg-primary/40 border border-white/10 rounded-xl px-4 py-3 mb-4">
          <span className="text-lg">📞</span>
          <p className="text-light font-semibold text-sm flex-1 tracking-wide">
            {phone}
          </p>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5
              hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
          >
            {copied ? (
              <span className="text-green-400 text-xs font-medium">
                ✓ Copied
              </span>
            ) : (
              <span className="text-muted text-xs">Copy</span>
            )}
          </button>
        </div>
        <a
          href={`tel:${phone}`}
          className="w-full h-11 bg-accent text-surface font-bold rounded-xl text-sm
            flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors cursor-pointer"
        >
          📞 Call now
        </a>
      </div>
    </div>
  );
}

export default function ActiveRun({
  order,
  onComplete,
}: {
  order: Order;
  onComplete: () => void;
}) {
  const [stage, setStage] = useState<RunStage>(() =>
    getInitialStage(order.status),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  const currentIndex = RUN_STAGES.findIndex((s) => s.key === stage);
  const current = RUN_STAGES[currentIndex];
  const isLast = currentIndex === RUN_STAGES.length - 1;

  const customerPhone = order.sender_phone ?? order.recipient_phone;
  const customerName = order.sender_name ?? "Customer";

  const handleAdvance = async () => {
    setLoading(true);
    setError("");
    try {
      // Send the current stage's API status — this is the NEXT backend status
      await api.patch(`/orders/${order.id}/status`, {
        status: current.apiStatus,
      });

      if (isLast) {
        onComplete();
      } else {
        setStage(RUN_STAGES[currentIndex + 1].key);
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === "string" && detail.includes("Cannot transition")) {
        // Order already at this status — just advance the UI
        if (isLast) {
          onComplete();
        } else {
          setStage(RUN_STAGES[currentIndex + 1].key);
        }
      } else {
        setError(
          typeof detail === "string"
            ? detail
            : "Failed to update status. Try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ADD THIS — sync stage when order status updates from backend
  useEffect(() => {
    const correctStage = getInitialStage(order.status);
    setStage(correctStage);
  }, [order.status]);

  return (
    <>
      <div className="space-y-4">
        <div className="bg-primary/40 border border-accent/20 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-2xl">
              {current.icon}
            </div>
            <div>
              <p className="text-light font-semibold">{current.label}</p>
              <p className="text-muted text-xs">{current.sub}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-1 mb-4">
            {RUN_STAGES.map((s, i) => (
              <div
                key={s.key}
                className={`flex-1 h-1.5 rounded-full transition-all duration-300
                  ${i <= currentIndex ? "bg-accent" : "bg-white/10"}`}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { label: "From", value: order.origin_park },
              { label: "To", value: order.destination },
              { label: "Waybill", value: order.waybill_number },
              { label: "Earning", value: `₦${order.price?.toLocaleString()}` },
            ].map((row) => (
              <div
                key={row.label}
                className="bg-primary/30 rounded-xl px-3 py-2"
              >
                <p className="text-muted text-[10px]">{row.label}</p>
                <p className="text-light text-xs font-semibold mt-0.5">
                  {row.value}
                </p>
              </div>
            ))}
          </div>

          {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

          <button
            onClick={handleAdvance}
            disabled={loading}
            className={`w-full h-11 rounded-xl text-sm font-bold transition-all cursor-pointer
              disabled:opacity-50 flex items-center justify-center gap-2
              ${
                isLast
                  ? "bg-green-500 text-white hover:bg-green-400"
                  : "bg-accent text-surface hover:bg-amber-400"
              }`}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              current.buttonText
            )}
          </button>
        </div>

        {/* Recipient contact card */}
        <div className="bg-primary/20 rounded-xl px-4 py-3">
          <p className="text-muted text-[10px] uppercase tracking-wide font-semibold mb-2">
            Recipient
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-light text-sm font-medium">
                {order.recipient_name}
              </p>
              <p className="text-muted text-xs">{order.destination}</p>
            </div>
            <button
              onClick={() =>
                navigator.clipboard.writeText(order.recipient_phone)
              }
              className="px-3 py-1.5 bg-accent/10 border border-accent/20 text-accent text-xs
                font-medium rounded-lg cursor-pointer hover:bg-accent/20 transition-colors
                flex items-center gap-1"
            >
              📞 {order.recipient_phone}
            </button>
          </div>
        </div>
      </div>

      {showPhoneModal && (
        <PhoneModal
          name={customerName}
          phone={customerPhone}
          onClose={() => setShowPhoneModal(false)}
        />
      )}
    </>
  );
}
