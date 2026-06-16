import type { DriverStatus } from "../Dashboard";

export default function DriverStatusToggle({
  status,
  onToggle,
}: {
  status: DriverStatus;
  onToggle: () => void;
}) {
  const isOnline = status !== "offline";

  return (
    <div
      className={`rounded-2xl p-5 border transition-all duration-300
      ${
        isOnline
          ? "bg-primary/40 border-accent/20"
          : "bg-primary/20 border-white/5"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-light font-semibold text-base">
            {status === "offline" && "You are offline"}
            {status === "online" && "You are online"}
            {status === "on-delivery" && "On delivery"}
          </p>
          <p className="text-muted text-xs mt-0.5">
            {status === "offline" && "Toggle to start receiving orders"}
            {status === "online" && "Listening for new orders near you"}
            {status === "on-delivery" && "Complete your current run first"}
          </p>
        </div>

        {/* Toggle switch */}
        <button
          onClick={onToggle}
          disabled={status === "on-delivery"}
          className={`relative w-14 h-7 rounded-full transition-all duration-300 cursor-pointer
            disabled:opacity-50 disabled:cursor-not-allowed shrink-0
            ${isOnline ? "bg-accent" : "bg-white/10"}`}
        >
          <span
            className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all duration-300
            ${isOnline ? "left-8" : "left-1"}`}
          />
        </button>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2 mt-4">
        <span
          className={`w-2 h-2 rounded-full shrink-0
          ${status === "offline" ? "bg-muted" : ""}
          ${status === "online" ? "bg-green-400 animate-pulse" : ""}
          ${status === "on-delivery" ? "bg-accent animate-pulse" : ""}`}
        />
        <span className="text-xs text-muted">
          {status === "offline" && "Not visible to customers"}
          {status === "online" && "Visible to customers · Orders incoming"}
          {status === "on-delivery" &&
            "Delivering · Go offline after completion"}
        </span>
      </div>
    </div>
  );
}
