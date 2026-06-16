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

      // Store token so /users/me is authenticated
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

      // Fetch real profile
      const { data: me } = await api.get("/users/me");

      console.log("User profile from backend:", me);
      
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
        navigate("/verify-otp", {
          state: { email: me.email, role: "driver" },
        });
        return;
      }

      // Store full verified profile
      setUser({
        id: me.id,
        email: me.email,
        firstName: me.first_name,
        lastName: me.last_name,
        role: me.role,
        phone: me.phone,
        is_superuser: me.is_superuser ?? false,
      });

      // Redirect based on role
      if (me.is_superuser) {
        navigate("/admin/dashboard", { replace: true });
      } else if (me.role === "driver") {
        navigate("/driver/dashboard", { replace: true });
      } else {
        navigate("/customer/dashboard", { replace: true });
      }
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
            Welcome
            <br />
            back.
          </h1>
          <p className="text-muted text-sm mt-4 leading-relaxed">
            Your packages are waiting. Sign in to track deliveries or pick up
            your next run.
          </p>
        </div>

        <div className="z-10 bg-primary/40 border border-light/5 rounded-2xl px-5 py-4">
          <p className="text-light text-sm leading-relaxed">
            "I sent my documents from Akure to Lagos in 4 hours. The driver
            called me when he arrived. 10/10."
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs text-accent font-semibold">
              AO
            </div>
            <p className="text-muted text-xs">Adaeze O. — Akure, Ondo State</p>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 bg-light flex items-center px-6 py-10 lg:px-14">
        <div className="w-full max-w-md mx-auto">
          <div className="flex items-center justify-between mb-8">
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

          <h2 className="text-surface text-2xl font-semibold mb-1">Sign in</h2>
          <p className="text-muted text-sm mb-7">
            Enter your credentials — we'll take you to the right place.
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
      </div>
    </div>
  );
}
