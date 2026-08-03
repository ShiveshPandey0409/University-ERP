import { Box, CircularProgress } from "@mui/material";
import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../app/AuthContext";

export default function ProtectedRoute() {
  const { me, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return me ? <Outlet /> : <Navigate to="/login" replace />;
}
