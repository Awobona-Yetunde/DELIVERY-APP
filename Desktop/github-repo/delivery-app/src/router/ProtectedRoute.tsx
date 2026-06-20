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

  if (allowedRole === "admin") {
    if (user.role !== "admin" && !user.is_superuser) {
      return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
  }

  if (user.role !== allowedRole) {
    if (user.role === "admin" || user.is_superuser)
      return <Navigate to="/admin/dashboard" replace />;
    if (user.role === "driver")
      return <Navigate to="/driver/dashboard" replace />;
    return <Navigate to="/customer/dashboard" replace />;
  }

  return <>{children}</>;
}
