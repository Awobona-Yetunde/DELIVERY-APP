import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function LogoutButton() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    localStorage.removeItem("driver-session");
    localStorage.removeItem("auth-storage");
    navigate("/login", { replace: true });
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="px-3 py-1.5 rounded-xl border border-white/10 text-muted text-xs
          hover:text-red-400 hover:border-red-400/30 transition-colors cursor-pointer"
      >
        Sign out
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 flex items-center justify-center px-4"
          style={{ zIndex: 99999 }}
        >
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowConfirm(false)}
          />
          <div className="relative bg-surface border border-white/10 rounded-2xl w-full max-w-xs p-6 shadow-2xl">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center text-2xl mx-auto mb-4">
                👋
              </div>
              <h3 className="text-light font-semibold text-lg mb-2">
                Sign out?
              </h3>
              <p className="text-muted text-xs mb-6">
                You'll need to sign in again to access your dashboard.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 h-10 bg-white/5 border border-white/10 text-light text-sm
                    font-medium rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 h-10 bg-red-500 text-white text-sm font-semibold
                    rounded-xl hover:bg-red-400 transition-colors cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
