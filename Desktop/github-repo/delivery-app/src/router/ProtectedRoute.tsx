import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function ProtectedRoute({
  children,
  allowedRole,
}: {
  children: React.ReactNode;
  allowedRole: "sender" | "driver" | "admin";
}) {
  const { user, token } = useAuthStore();

  if (!token || !user) return <Navigate to="/login" replace />;

  // Admin can access admin dashboard
  if (allowedRole === "admin") {
    if (!user.is_superuser) return <Navigate to="/login" replace />;
    return <>{children}</>;
  }

  if (user.role !== allowedRole) {
    return (
      <Navigate
        to={
          user.role === "driver" ? "/driver/dashboard" : "/customer/dashboard"
        }
        replace
      />
    );
  }

  return <>{children}</>;
}
