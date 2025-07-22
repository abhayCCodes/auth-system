// frontend/src/utils/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const userName = localStorage.getItem("userName");
  return userName ? children : <Navigate to="/auth" />;
}
