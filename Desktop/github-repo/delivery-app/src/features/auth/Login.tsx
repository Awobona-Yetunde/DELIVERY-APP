import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { useAuthStore } from "../../store/authStore";

export default function Login() {
  const navigate = useNavigate();
  const { login, setUser } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const { data } = await api.post("/auth/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      login(
        {
          id: "",
          email,
          firstName: "",
          lastName: "",
          role: "sender",
          phone: "",
          is_superuser: false,
        },
        data.access_token,
      );

      const { data: me } = await api.get("/users/me");

      if (me.role === "driver" && me.is_verified === false) {
        login(
          {
            id: "",
            email,
            firstName: "",
            lastName: "",
            role: "sender",
            phone: "",
            is_superuser: false,
          },
          "",
        );
        navigate("/verify-otp", { state: { email: me.email, role: "driver" } });
        return;
      }

      setUser({
        id: me.id,
        email: me.email,
        firstName: me.first_name,
        lastName: me.last_name,
        role: me.role,
        phone: me.phone,
        is_superuser: me.is_superuser ?? false,
      });

      if (me.is_superuser || me.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (me.role === "driver")
        navigate("/driver/dashboard", { replace: true });
      else navigate("/customer/dashboard", { replace: true });
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(
        typeof detail === "string" ? detail : "Invalid email or password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-xl">
            📦
          </div>
          <span className="text-light text-xl font-semibold tracking-tight">
            SendRun
          </span>
        </div>

        {/* Card */}
        <div className="bg-light rounded-2xl px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 text-muted text-xs hover:text-surface transition-colors cursor-pointer"
            >
              ← Back to home
            </button>
            <button
              onClick={() => navigate("/")}
              className="text-xs text-primary font-medium hover:underline cursor-pointer"
            >
              🧮 Just checking price?
            </button>
          </div>

          <h2 className="text-surface text-2xl font-semibold mb-1">
            Welcome back
          </h2>
          <p className="text-muted text-sm mb-7">
            Sign in to track deliveries or pick up your next run.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-semibold text-primary uppercase tracking-wide mb-1.5">
                Email address
              </label>
              <input
                type="email"
                placeholder="chidi@gmail.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                className="w-full h-11 border border-stone-200 rounded-xl px-3 text-sm text-surface
                  outline-none bg-white focus:border-primary transition-colors placeholder:text-stone-300"
              />
            </div>

            <div className="mb-2">
              <label className="block text-xs font-semibold text-primary uppercase tracking-wide mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  className="w-full h-11 border border-stone-200 rounded-xl px-3 pr-16 text-sm text-surface
                    outline-none bg-white focus:border-primary transition-colors placeholder:text-stone-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-primary cursor-pointer"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex justify-end mb-7">
              <Link
                to="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </Link>
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
                  Signing in...
                </>
              ) : (
                <>Sign in →</>
              )}
            </button>

            <p className="text-center text-sm text-muted mt-5">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-primary font-medium hover:underline"
              >
                Create one
              </Link>
            </p>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-muted text-xs mt-6">
          © 2025 SendRun. Intercity logistics for Ondo State.
        </p>
      </div>
    </div>
  );
}
