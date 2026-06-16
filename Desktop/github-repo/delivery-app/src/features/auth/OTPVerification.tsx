import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../lib/api";

export default function OTPVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email ?? "";

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(59);
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCountdown === 0) {
      setCanResend(true);
      return;
    }
    const t = setTimeout(() => setResendCountdown((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);
    setError("");
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6)
      .split("");
    const updated = [...otp];
    digits.forEach((d, i) => {
      updated[i] = d;
    });
    setOtp(updated);
    inputs.current[Math.min(digits.length, 5)]?.focus();
  };

  const handleResend = async () => {
    if (!canResend) return;
    setResendLoading(true);
    setResendSuccess(false);
    try {
      await api.post("/auth/otp/request", { email });
      setCanResend(false);
      setResendCountdown(59);
      setOtp(["", "", "", "", "", ""]);
      setResendSuccess(true);
      inputs.current[0]?.focus();
    } catch (err: any) {
      setError(
        err.response?.data?.detail ?? "Failed to resend OTP. Try again.",
      );
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      setError("Enter the 6-digit code sent to your email.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      await api.post("/auth/otp/verify", { email, otp: code });
      navigate("/login", { state: { role: "driver" } });
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : "Invalid or expired OTP. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const filled = otp.filter(Boolean).length;
  const progress = (filled / 6) * 100;

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-light rounded-2xl px-8 py-10">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">
            📩
          </div>

          <h1 className="text-surface text-2xl font-semibold text-center mb-2">
            Check your inbox
          </h1>
          <p className="text-muted text-sm text-center leading-relaxed mb-8">
            We sent a 6-digit code to{" "}
            <span className="text-primary font-medium">{email}</span>.
            <br />
            Enter it below to verify your account.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div
              className="flex gap-3 justify-center mb-4"
              onPaste={handlePaste}
            >
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  autoFocus={i === 0}
                  className={`w-12 h-14 text-center text-xl font-semibold rounded-xl border-2 outline-none
                    bg-white text-surface transition-all duration-150
                    ${digit ? "border-primary" : "border-stone-200"}
                    ${error ? "border-red-400" : ""}
                    focus:border-primary focus:ring-2 focus:ring-primary/10`}
                />
              ))}
            </div>

            <div className="w-full h-1 bg-stone-200 rounded-full mb-5 overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {error && (
              <p className="text-center text-sm text-red-500 mb-4">{error}</p>
            )}
            {resendSuccess && (
              <p className="text-center text-sm text-green-600 mb-4">
                Code resent.
              </p>
            )}

            <button
              type="submit"
              disabled={loading || filled < 6}
              className="w-full h-12 bg-primary text-accent font-semibold rounded-xl
                flex items-center justify-center gap-2 text-sm transition-all
                hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                <>Verify & continue →</>
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={resendLoading}
                className="text-sm text-primary font-medium hover:underline cursor-pointer disabled:opacity-50"
              >
                {resendLoading ? "Sending..." : "Resend code"}
              </button>
            ) : (
              <p className="text-sm text-muted">
                Resend code in{" "}
                <span className="text-primary font-medium tabular-nums">
                  0:{String(resendCountdown).padStart(2, "0")}
                </span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 mt-6">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-xs text-muted">wrong email?</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          <button
            onClick={() => navigate("/register")}
            className="w-full mt-4 text-sm text-muted hover:text-primary transition-colors text-center cursor-pointer"
          >
            ← Go back and change email
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6">
          <div className="w-6 h-6 bg-accent rounded-lg flex items-center justify-center text-sm">
            📦
          </div>
          <span className="text-light text-sm font-medium">SendRun</span>
        </div>
      </div>
    </div>
  );
}
