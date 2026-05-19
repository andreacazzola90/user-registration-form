"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Paper,
  Stack,
  TextField,
  Button,
  Typography,
  ThemeProvider,
  createTheme,
  Alert,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";

const adminTheme = createTheme({
  palette: {
    primary: { main: "#0f8a84" },
    background: { default: "#eef2f6", paper: "#ffffff" },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: "var(--font-sans)",
    h4: { fontFamily: "var(--font-serif)", fontWeight: 700 },
  },
});

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("andracazzola90@gmail.com");
  const [password, setPassword] = useState("farfalla24");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message ?? "Credenziali non valide");
        return;
      }

      router.push("/admin/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemeProvider theme={adminTheme}>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#eef2f6",
          py: 2,
          px: 1,
        }}
      >
        <Stack
          sx={{
            width: "100%",
            maxWidth: 420,
          }}
        >
          <Paper elevation={2} sx={{ overflow: "hidden", borderRadius: 3 }}>
            <Box
              sx={{
                background: "linear-gradient(135deg, #0f8a84 0%, #0d7473 100%)",
                color: "white",
                p: 3,
              }}
            >
              <Box sx={{ display: "inline-flex", mb: 2 }}>
                <Box
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    borderRadius: "50%",
                    p: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <PersonIcon sx={{ color: "#0f8a84", fontSize: 28 }} />
                </Box>
              </Box>
              <Typography
                sx={{ fontSize: 12, color: "rgba(255,255,255,0.8)", mb: 1 }}
              >
                Welcome
              </Typography>
              <Typography variant="h4" sx={{ color: "white" }}>
                Sign In
              </Typography>
            </Box>

            <Box sx={{ p: 3.5 }}>
              <form onSubmit={handleSubmit}>
                <Stack spacing={3}>
                  <TextField
                    id="email"
                    type="email"
                    label="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    fullWidth
                    size="small"
                    variant="outlined"
                  />

                  <TextField
                    id="password"
                    type="password"
                    label="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    fullWidth
                    size="small"
                    variant="outlined"
                  />

                  <Button
                    type="submit"
                    disabled={loading}
                    variant="contained"
                    fullWidth
                    sx={{
                      backgroundColor: "#0f8a84",
                      textTransform: "none",
                      fontSize: 15,
                      fontWeight: 600,
                      py: 1.2,
                    }}
                  >
                    {loading ? "Accesso..." : "Sign In"}
                  </Button>

                  {error && <Alert severity="error">{error}</Alert>}
                </Stack>
              </form>
            </Box>
          </Paper>
        </Stack>
      </Box>
    </ThemeProvider>
  );
}
