import { useState, useEffect } from "react";
import api from "../../../lib/api";

const PACKAGE_SIZES = [
  { value: "small", label: "Small", sub: "Fits in a handbag" },
  { value: "medium", label: "Medium", sub: "Fits in a backpack" },
  { value: "large", label: "Large", sub: "Fits in a suitcase" },
  { value: "extra_large", label: "Extra Large", sub: "Bigger than a suitcase" },
];

const PACKAGE_WEIGHTS = [
  { value: "very_light", label: "Very Light", sub: "Under 1kg" },
  { value: "light", label: "Light", sub: "1 – 5kg" },
  { value: "medium", label: "Medium", sub: "5 – 20kg" },
  { value: "heavy", label: "Heavy", sub: "20kg and above" },
];

const VEHICLE_TYPES = [
  { value: "small_car", label: "Small Car", icon: "🚗", sub: "Up to 20kg" },
  { value: "big_bus", label: "Big Bus", icon: "🚌", sub: "Heavy loads" },
];

interface Route {
  id: string;
  origin: string;
  destination: string;
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
  distance_km: number;
  estimated_duration_mins: number;
  risk_level: number;
}

interface BookingForm {
  packageDescription: string;
  packageSize: string;
  packageWeight: string;
  originPark: string;
  destination: string;
  vehicleType: string;
  recipientName: string;
  recipientPhone: string;
}

const INITIAL_FORM: BookingForm = {
  packageDescription: "",
  packageSize: "",
  packageWeight: "",
  originPark: "",
  destination: "",
  vehicleType: "small_car",
  recipientName: "",
  recipientPhone: "",
};

const SELECT_CLASS =
  "w-full bg-[#0D1F17] border border-white/10 rounded-xl px-3 h-10 text-sm text-light outline-none focus:border-accent transition-colors";

export default function BookingPanel({
  onBook,
}: {
  onBook: (order: any) => void;
}) {
  const [form, setForm] = useState<BookingForm>(INITIAL_FORM);
  const [step, setStep] = useState<1 | 2>(1);
  const [origins, setOrigins] = useState<string[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [originsLoading, setOriginsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const today = new Date();
  const dayOfWeek = today.getDay();

  // Fetch origins on mount
  useEffect(() => {
    const fetch_ = async () => {
      setOriginsLoading(true);
      try {
        const { data } = await api.get("/routes/origins");
        const list = Array.isArray(data) ? data : (data?.origins ?? []);
        setOrigins(list);
      } catch {
        setOrigins([]);
      } finally {
        setOriginsLoading(false);
      }
    };
    fetch_();
  }, []);

  // Fetch destinations when origin changes
  useEffect(() => {
    if (!form.originPark) {
      setRoutes([]);
      return;
    }
    const fetch_ = async () => {
      try {
        const { data } = await api.get("/routes/destinations", {
          params: { origin: form.originPark },
        });
        setRoutes(Array.isArray(data) ? data : []);
      } catch {
        setRoutes([]);
      }
    };
    fetch_();
  }, [form.originPark]);

  const set =
    (field: keyof BookingForm) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setSubmitError("");
    };

  const step1Complete =
    form.packageDescription &&
    form.packageSize &&
    form.packageWeight &&
    form.originPark &&
    form.destination &&
    form.vehicleType;

  const step2Complete = form.recipientName && form.recipientPhone;

  const handleContinue = () => {
    if (!step1Complete) return;
    setStep(2);
  };

  const handleBook = async () => {
    if (!step2Complete) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const { data } = await api.post("/orders", {
        package_description: form.packageDescription,
        package_size: form.packageSize,
        package_weight: form.packageWeight,
        origin_park: form.originPark,
        destination: form.destination,
        vehicle_type: form.vehicleType,
        recipient_name: form.recipientName,
        recipient_phone: `+234${form.recipientPhone.replace(/^0/, "")}`,
        day_of_week: dayOfWeek,
        is_festive_period: false,
        fuel_price_per_litre: 897,
      });
      onBook(data);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setSubmitError(
        typeof detail === "string"
          ? detail
          : "Failed to place order. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-5 space-y-5">
      <div>
        <h2 className="text-light text-lg font-semibold">Send a package</h2>
        <p className="text-muted text-xs mt-0.5">
          Fill in the details and we'll match you with a driver
        </p>
      </div>

      {/* Step pills */}
      <div className="flex gap-2">
        {[1, 2].map((s) => (
          <button
            key={s}
            onClick={() => {
              if (s === 2 && !step1Complete) return;
              setStep(s as 1 | 2);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer
              ${step === s ? "bg-accent text-surface" : "bg-primary/40 text-muted"}`}
          >
            {s === 1 ? "1. Package & route" : "2. Recipient & confirm"}
          </button>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">

          {/* Route */}
          <div className="bg-primary/30 rounded-2xl p-4 space-y-3">
            <p className="text-muted text-[10px] font-semibold uppercase tracking-wide">
              Route
            </p>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                <div className="w-px h-6 bg-muted/30" />
                <div className="w-2.5 h-2.5 rounded-full border-2 border-light" />
              </div>
              <div className="flex-1 space-y-2">

                {/* Origin select */}
                <select
                  value={form.originPark}
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      originPark: e.target.value,
                      destination: "",
                    }));
                  }}
                  disabled={originsLoading}
                  style={{ colorScheme: "dark" }}
                  className={SELECT_CLASS}
                >
                  <option
                    value=""
                    className="bg-[#0D1F17] text-[#8A9E95]"
                  >
                    {originsLoading
                      ? "Loading parks..."
                      : "Pickup park"}
                  </option>
                  {origins.map((o) => (
                    <option
                      key={o}
                      value={o}
                      className="bg-[#0D1F17] text-[#F2EDE4]"
                    >
                      {o}
                    </option>
                  ))}
                </select>

                {/* Destination select */}
                <select
                  value={form.destination}
                  onChange={set("destination")}
                  disabled={!form.originPark || routes.length === 0}
                  style={{ colorScheme: "dark" }}
                  className={`${SELECT_CLASS} disabled:opacity-40`}
                >
                  <option
                    value=""
                    className="bg-[#0D1F17] text-[#8A9E95]"
                  >
                    {!form.originPark
                      ? "Select origin first"
                      : routes.length === 0
                      ? "Loading destinations..."
                      : "where to?"}
                  </option>
                  {routes.map((r) => (
                    <option
                      key={r.id}
                      value={r.destination}
                      className="bg-[#0D1F17] text-[#F2EDE4]"
                    >
                      {r.destination}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Package description */}
          <div>
            <p className="text-muted text-[10px] font-semibold uppercase tracking-wide mb-2">
              What are you sending?
            </p>
            <textarea
              value={form.packageDescription}
              onChange={set("packageDescription")}
              placeholder="e.g. A box of clothes and documents for my sister"
              rows={2}
              className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2.5
                text-sm text-light outline-none focus:border-accent transition-colors
                placeholder:text-muted/50 resize-none"
            />
          </div>

          {/* Package size */}
          <div>
            <p className="text-muted text-[10px] font-semibold uppercase tracking-wide mb-2">
              Package size
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PACKAGE_SIZES.map((s) => (
                <button
                  key={s.value}
                  onClick={() =>
                    setForm((prev) => ({ ...prev, packageSize: s.value }))
                  }
                  className={`px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer
                    ${
                      form.packageSize === s.value
                        ? "border-accent bg-accent/10"
                        : "border-white/10 bg-primary/20 hover:border-white/20"
                    }`}
                >
                  <p
                    className={`text-xs font-medium ${
                      form.packageSize === s.value
                        ? "text-accent"
                        : "text-light"
                    }`}
                  >
                    {s.label}
                  </p>
                  <p className="text-muted text-[10px] mt-0.5">{s.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Package weight */}
          <div>
            <p className="text-muted text-[10px] font-semibold uppercase tracking-wide mb-2">
              Package weight
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PACKAGE_WEIGHTS.map((w) => (
                <button
                  key={w.value}
                  onClick={() =>
                    setForm((prev) => ({ ...prev, packageWeight: w.value }))
                  }
                  className={`px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer
                    ${
                      form.packageWeight === w.value
                        ? "border-accent bg-accent/10"
                        : "border-white/10 bg-primary/20 hover:border-white/20"
                    }`}
                >
                  <p
                    className={`text-xs font-medium ${
                      form.packageWeight === w.value
                        ? "text-accent"
                        : "text-light"
                    }`}
                  >
                    {w.label}
                  </p>
                  <p className="text-muted text-[10px] mt-0.5">{w.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle type */}
          <div>
            <p className="text-muted text-[10px] font-semibold uppercase tracking-wide mb-2">
              Vehicle type
            </p>
            <div className="grid grid-cols-2 gap-2">
              {VEHICLE_TYPES.map((v) => (
                <button
                  key={v.value}
                  onClick={() =>
                    setForm((prev) => ({ ...prev, vehicleType: v.value }))
                  }
                  className={`flex items-center gap-2 px-3 py-3 rounded-xl border transition-all cursor-pointer
                    ${
                      form.vehicleType === v.value
                        ? "border-accent bg-accent/10"
                        : "border-white/10 bg-primary/20 hover:border-white/20"
                    }`}
                >
                  <span className="text-xl">{v.icon}</span>
                  <div className="text-left">
                    <p
                      className={`text-xs font-medium ${
                        form.vehicleType === v.value
                          ? "text-accent"
                          : "text-light"
                      }`}
                    >
                      {v.label}
                    </p>
                    <p className="text-muted text-[10px]">{v.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={!step1Complete}
            onClick={handleContinue}
            className="w-full h-11 bg-accent text-surface font-semibold rounded-xl text-sm
              disabled:opacity-40 hover:bg-amber-400 transition-colors cursor-pointer
              disabled:cursor-not-allowed"
          >
            Continue →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">

          {/* Route summary */}
          <div className="flex items-center gap-2 bg-primary/30 rounded-xl px-4 py-2.5">
            <span className="text-accent text-xs font-semibold">
              {form.originPark}
            </span>
            <span className="text-muted text-xs">→</span>
            <span className="text-light text-xs font-semibold">
              {form.destination}
            </span>
            <button
              onClick={() => setStep(1)}
              className="ml-auto text-muted text-[10px] hover:text-accent cursor-pointer"
            >
              Edit
            </button>
          </div>

          {/* Package summary chips */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Size", value: form.packageSize.replace(/_/g, " ") },
              {
                label: "Weight",
                value: form.packageWeight.replace(/_/g, " "),
              },
              {
                label: "Vehicle",
                value: form.vehicleType.replace(/_/g, " "),
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-primary/30 rounded-xl px-2 py-2.5 text-center"
              >
                <p className="text-light text-xs font-semibold capitalize">
                  {s.value}
                </p>
                <p className="text-muted text-[10px]">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Recipient details */}
          <div>
            <p className="text-muted text-[10px] font-semibold uppercase tracking-wide mb-2">
              Recipient details
            </p>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Recipient's full name"
                value={form.recipientName}
                onChange={set("recipientName")}
                className="w-full bg-white/10 border border-white/10 rounded-xl px-3 h-10
                  text-sm text-light outline-none focus:border-accent transition-colors
                  placeholder:text-muted/50"
              />
              <div className="flex">
                <span
                  className="h-10 px-3 bg-white/5 border border-white/10 border-r-0
                  rounded-l-xl text-xs text-accent font-medium flex items-center whitespace-nowrap"
                >
                  🇳🇬 +234
                </span>
                <input
                  type="tel"
                  placeholder="Recipient phone"
                  value={form.recipientPhone}
                  onChange={set("recipientPhone")}
                  className="flex-1 bg-white/10 border border-white/10 rounded-r-xl px-3 h-10
                    text-sm text-light outline-none focus:border-accent transition-colors
                    placeholder:text-muted/50"
                />
              </div>
            </div>
          </div>

          {/* ML pricing note */}
          <div className="flex items-start gap-2 bg-accent/10 border border-accent/20 rounded-xl px-3 py-2.5">
            <span className="text-base shrink-0">🤖</span>
            <p className="text-accent text-xs leading-relaxed">
              Price is calculated by our ML model based on your route, package,
              and current conditions. You'll see the final price after booking.
            </p>
          </div>

          {/* Error */}
          {submitError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
              <p className="text-red-400 text-xs">{submitError}</p>
            </div>
          )}

          {/* Book button */}
          <button
            disabled={!step2Complete || submitting}
            onClick={handleBook}
            className="w-full h-12 bg-primary border border-accent/30 text-accent font-semibold
              rounded-xl text-sm disabled:opacity-40 hover:bg-accent hover:text-surface
              transition-all cursor-pointer disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                Placing order...
              </>
            ) : (
              <>🚀 Book delivery</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}