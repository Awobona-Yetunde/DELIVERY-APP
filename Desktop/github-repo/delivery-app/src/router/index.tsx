import { createBrowserRouter } from "react-router-dom";
import LandingPage from "../features/landing/LandingPage";
import Register from "../features/auth/Register";
import Login from "../features/auth/Login";
import OTPVerification from "../features/auth/OTPVerification";
import CustomerDashboard from "../features/customer/Dashboard";
import DriverDashboard from "../features/driver/Dashboard";
import ProtectedRoute from "./ProtectedRoute";
import AdminDashboard from "../features/admin/Dashboard";

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/verify-otp", element: <OTPVerification /> },
  {
    path: "/customer/dashboard",
    element: (
      <ProtectedRoute allowedRole="sender">
        <CustomerDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/driver/dashboard",
    element: (
      <ProtectedRoute allowedRole="driver">
        <DriverDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/dashboard",
    element: (
      <ProtectedRoute allowedRole="sender">
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
]);
