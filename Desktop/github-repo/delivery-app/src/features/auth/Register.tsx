import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../lib/api";

type Role = "sender" | "driver";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  address: string;
  vehicleType: "small_car" | "big_bus";
  plateNumber: string;
  stateOfOperation: string;
  ninOrLicense: string;
  photo: File | null;
}

const INITIAL_FORM: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  address: "",
  vehicleType: "small_car",
  plateNumber: "",
  ninOrLicense: "",
  photo: null,
  stateOfOperation: "",
};

const NIGERIAN_STATES = [
  "Ondo State",
  "Lagos State",
  "Abuja (FCT)",
  "Ogun State",
  "Osun State",
  "Oyo State",
  "Ekiti State",
  "Edo State",
  "Delta State",
  "Rivers State",
  "Kano State",
  "Kaduna State",
];

export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("sender");
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {},
  );
  const [states, setStates] = useState<string[]>([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set =
    (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: "" }));
      setApiError("");
    };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((prev) => ({ ...prev, photo: file }));
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.firstName.trim()) newErrors.firstName = "Required";
    if (!form.lastName.trim()) newErrors.lastName = "Required";
    if (!form.email.includes("@")) newErrors.email = "Enter a valid email";
    if (form.phone.length < 10) newErrors.phone = "Enter a valid phone number";
    if (!form.address.trim()) newErrors.address = "Required";
    if (form.password.length < 8) newErrors.password = "Min 8 characters";
    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (role === "driver") {
      if (!form.plateNumber.trim()) newErrors.plateNumber = "Required";
      if (!form.ninOrLicense.trim()) newErrors.ninOrLicense = "Required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const fetchStates = async () => {
      setStatesLoading(true);
      try {
        const { data } = await api.get("/locations/states");
        setStates(data.states);
      } catch {
        setStates([]);
      } finally {
        setStatesLoading(false);
      }
    };
    fetchStates();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError("");

    try {
      const phoneFormatted = `+234${form.phone.replace(/^0/, "")}`;

      if (role === "sender") {
        await api.post("/auth/sender/register", {
          email: form.email,
          password: form.password,
          is_active: true,
          is_superuser: false,
          is_verified: false,
          first_name: form.firstName,
          last_name: form.lastName,
          phone: phoneFormatted,
          address: form.address,
          role: "sender",
        });
        // Customer goes straight to login
        navigate("/login", { state: { role: "sender" } });
      } else {
        await api.post("/auth/driver/register", {
          email: form.email,
          password: form.password,
          is_active: true,
          is_superuser: false,
          is_verified: false,
          first_name: form.firstName,
          last_name: form.lastName,
          phone: phoneFormatted,
          address: form.address,
          role: "driver",
          vehicle_type: form.vehicleType,
          plate_number: form.plateNumber,
          state_of_operation: form.stateOfOperation,
          nin_license: form.ninOrLicense,
        });
        // Driver goes to OTP
        navigate("/verify-otp", {
          state: { email: form.email, role: "driver" },
        });
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === "string") setApiError(detail);
      else if (Array.isArray(detail))
        setApiError(detail[0]?.msg ?? "Registration failed");
      else setApiError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col lg:flex-row">
      {/* Left branding panel */}
      <div className="lg:w-[42%] bg-surface px-8 py-10 lg:px-12 lg:py-14 flex flex-col justify-between gap-10 relative overflow-hidden">
        <div className="absolute w-72 h-72 rounded-full border-[50px] border-accent/10 -bottom-20 -left-20 pointer-events-none" />
        <div className="absolute w-44 h-44 rounded-full border-[35px] border-primary/30 top-16 -right-10 pointer-events-none" />

        <div className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-xl">
            📦
          </div>
          <span className="text-light text-xl font-semibold tracking-tight">
            SendRun
          </span>
        </div>

        <div className="z-10">
          <h1 className="text-light text-3xl lg:text-4xl font-semibold leading-snug">
            Send anything.
            <br />
            Anywhere in
            <br />
            Nigeria.
          </h1>
          <p className="text-muted text-sm mt-4 leading-relaxed">
            Book a driver from Ondo to Lagos, Abuja, Port Harcourt — live
            tracking included.
          </p>
        </div>

        <div className="flex flex-col gap-3 z-10">
          {[
            {
              icon: "📍",
              title: "Intercity Delivery",
              sub: "Ondo → Lagos, Abuja & more",
            },
            {
              icon: "⚡",
              title: "Real-time Matching",
              sub: "Drivers accept in seconds",
            },
            {
              icon: "🛡️",
              title: "Track your package",
              sub: "Live updates all the way",
            },
          ].map((s) => (
            <div
              key={s.title}
              className="flex items-center gap-3 bg-primary/40 border border-light/5 rounded-xl px-4 py-3"
            >
              <span className="text-xl">{s.icon}</span>
              <div>
                <p className="text-light text-sm font-medium">{s.title}</p>
                <p className="text-muted text-xs">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 bg-light px-6 py-10 lg:px-14 lg:py-14 overflow-y-auto">
        <div className="max-w-md mx-auto">
          <h2 className="text-surface text-2xl font-semibold mb-1">
            Create your account
          </h2>
          <p className="text-muted text-sm mb-7">
            Are you sending a package or delivering one?
          </p>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-7">
            {(
              [
                {
                  value: "sender",
                  label: "Customer",
                  sub: "I want to send",
                  icon: "🙋",
                },
                {
                  value: "driver",
                  label: "Driver",
                  sub: "I want to deliver",
                  icon: "🚗",
                },
              ] as const
            ).map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`flex items-center gap-3 border-[1.5px] rounded-xl px-4 py-3 transition-all cursor-pointer
                  ${
                    role === r.value
                      ? "bg-primary border-primary text-light"
                      : "bg-white border-stone-200 text-surface hover:border-primary/40"
                  }`}
              >
                <span className="text-xl">{r.icon}</span>
                <div className="text-left">
                  <p
                    className={`text-sm font-medium ${role === r.value ? "text-light" : "text-surface"}`}
                  >
                    {r.label}
                  </p>
                  <p className="text-xs text-muted">{r.sub}</p>
                </div>
              </button>
            ))}
          </div>

          {apiError && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-1.5 text-muted text-xs hover:text-light transition-colors cursor-pointer"
              >
                ← Back to home
              </button>
            </div>
            {/* Photo upload */}
            <div className="flex items-center gap-5 mb-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-full bg-stone-100 border-2 border-dashed border-stone-300
                  flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/60 transition-colors shrink-0"
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl">📷</span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-surface">
                  Profile photo
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {role === "driver"
                    ? "Customers see this when you accept a delivery. Optional."
                    : "Optional — helps drivers identify you."}
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 text-xs text-primary font-medium underline underline-offset-2"
                >
                  {photoPreview ? "Change photo" : "Upload photo"}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>

            {/* Name */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Field label="First name" error={errors.firstName}>
                <input
                  type="text"
                  placeholder="Chidi"
                  value={form.firstName}
                  onChange={set("firstName")}
                />
              </Field>
              <Field label="Last name" error={errors.lastName}>
                <input
                  type="text"
                  placeholder="Okafor"
                  value={form.lastName}
                  onChange={set("lastName")}
                />
              </Field>
            </div>

            <Field label="Email address" error={errors.email} className="mb-4">
              <input
                type="email"
                placeholder="chidi@gmail.com"
                value={form.email}
                onChange={set("email")}
              />
            </Field>

            <Field label="Phone number" error={errors.phone} className="mb-4">
              <div className="flex">
                <span
                  className="h-11 px-3 bg-stone-100 border border-stone-200 border-r-0
                  rounded-l-xl text-sm text-primary font-medium flex items-center whitespace-nowrap"
                >
                  🇳🇬 +234
                </span>
                <input
                  type="tel"
                  placeholder="0801 234 5678"
                  value={form.phone}
                  onChange={set("phone")}
                  className="rounded-l-none!"
                />
              </div>
            </Field>

            <Field
              label="Home / default address"
              error={errors.address}
              className="mb-4"
            >
              <input
                type="text"
                placeholder="e.g. 12 Alagbaka Estate, Akure, Ondo State"
                value={form.address}
                onChange={set("address")}
              />
            </Field>

            {/* Driver extras */}
            {role === "driver" && (
              <div className="mb-4">
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-stone-200" />
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Vehicle details
                  </span>
                  <div className="flex-1 h-px bg-stone-200" />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Field label="Vehicle type" error={errors.vehicleType}>
                    <select
                      value={form.vehicleType}
                      onChange={set("vehicleType")}
                    >
                      <option value="small_car">Small Car</option>
                      <option value="big_bus">Big Bus</option>
                    </select>
                  </Field>
                  <Field label="Plate number" error={errors.plateNumber}>
                    <input
                      type="text"
                      placeholder="LND 123 XY"
                      value={form.plateNumber}
                      onChange={set("plateNumber")}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="State of operation"
                    error={errors.stateOfOperation}
                  >
                    <select
                      value={form.stateOfOperation}
                      onChange={set("stateOfOperation")}
                      disabled={statesLoading}
                    >
                      <option value="">
                        {statesLoading ? "Loading states..." : "Select state"}
                      </option>
                      {states.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="NIN / License no." error={errors.ninOrLicense}>
                    <input
                      type="text"
                      placeholder="NIN or license no."
                      value={form.ninOrLicense}
                      onChange={set("ninOrLicense")}
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* Password */}
            <div className="grid grid-cols-2 gap-3 mb-6 mt-4">
              <Field label="Password" error={errors.password}>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 8 characters"
                    value={form.password}
                    onChange={set("password")}
                    className="pr-10!"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-xs"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </Field>
              <Field label="Confirm password" error={errors.confirmPassword}>
                <input
                  type="password"
                  placeholder="Repeat password"
                  value={form.confirmPassword}
                  onChange={set("confirmPassword")}
                />
              </Field>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary text-accent font-semibold rounded-xl flex items-center
                justify-center gap-2 text-sm hover:bg-surface transition-colors disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  {role === "driver"
                    ? "Continue to verification →"
                    : "Create account →"}
                </>
              )}
            </button>

            <p className="text-center text-sm text-muted mt-5">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-primary uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <div
        className={`
        [&_input]:w-full [&_input]:h-11 [&_input]:border [&_input]:border-stone-200
        [&_input]:rounded-xl [&_input]:px-3 [&_input]:text-sm [&_input]:text-surface
        [&_input]:outline-none [&_input]:bg-white [&_input:focus]:border-primary
        [&_input]:transition-colors [&_input::placeholder]:text-stone-300
        [&_select]:w-full [&_select]:h-11 [&_select]:border [&_select]:border-stone-200
        [&_select]:rounded-xl [&_select]:px-3 [&_select]:text-sm [&_select]:text-surface
        [&_select]:outline-none [&_select]:bg-white [&_select:focus]:border-primary
        ${error ? "[&_input]:border-red-400 [&_select]:border-red-400" : ""}
      `}
      >
        {children}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
