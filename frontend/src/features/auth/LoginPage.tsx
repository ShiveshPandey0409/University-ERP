import { useState, type FormEvent } from "react";

import { LockOutlined, PersonOutline, WorkspacePremiumOutlined } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { AxiosError } from "axios";
import { motion } from "framer-motion";
import { Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../../app/AuthContext";

export default function LoginPage() {
  const { me, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (me) return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(username.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      const ax = err as AxiosError<{ detail?: string }>;
      setError(ax.response?.data?.detail ?? "Login failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        p: 2,
        background:
          "radial-gradient(1200px 600px at 8% -10%, rgba(99,102,241,0.28), transparent), radial-gradient(1000px 520px at 100% 0%, rgba(13,148,136,0.22), transparent), linear-gradient(180deg,#0b0e14,#161b26)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <Card sx={{ width: 404, maxWidth: "100%", borderRadius: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Stack alignItems="center" spacing={1} sx={{ mb: 3 }}>
              <Box
                sx={{
                  width: 58,
                  height: 58,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                  color: "#fff",
                  boxShadow: "0 8px 24px -8px rgba(79,70,229,0.6)",
                }}
              >
                <WorkspacePremiumOutlined />
              </Box>
              <Typography variant="h6">PTSNSU ERP</Typography>
              <Typography variant="body2" color="text.secondary">
                University Information Management System
              </Typography>
            </Stack>
            <form onSubmit={onSubmit}>
              <Stack spacing={2}>
                {error && <Alert severity="error">{error}</Alert>}
                <TextField
                  label="User ID / Enrollment No."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  fullWidth
                  autoFocus
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutline fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button type="submit" variant="contained" size="large" disabled={busy}>
                  {busy ? "Signing in…" : "Login"}
                </Button>
              </Stack>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
}
