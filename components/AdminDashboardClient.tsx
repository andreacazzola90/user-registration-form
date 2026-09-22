"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import LogoutIcon from "@mui/icons-material/Logout";
import DevicesIcon from "@mui/icons-material/Devices";
import { Box, Button, Stack, ThemeProvider, createTheme } from "@mui/material";

const adminTheme = createTheme({
  palette: {
    primary: { main: "#0f8a84" },
    background: { default: "#eef2f6", paper: "#ffffff" },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: "var(--font-sans)",
    h4: { fontFamily: "var(--font-serif)", fontWeight: 700 },
    h5: { fontFamily: "var(--font-serif)", fontWeight: 600 },
  },
});

type Props = {
  children: ReactNode;
};

export function AdminDashboardClient({ children }: Props) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout(allSessions: boolean) {
    setLoggingOut(true);
    try {
      await fetch(`/api/admin/logout${allSessions ? "?all=true" : ""}`, {
        method: "POST",
      });
      router.replace("/admin/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <ThemeProvider theme={adminTheme}>
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#eef2f6",
          py: 3,
          px: { xs: 1, sm: 2 },
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ maxWidth: 1400, mx: "auto", mb: 2, justifyContent: "flex-end" }}
        >
          <Button
            size="small"
            variant="outlined"
            startIcon={<DevicesIcon />}
            disabled={loggingOut}
            onClick={() => logout(true)}
          >
            Disconnetti tutti
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<LogoutIcon />}
            disabled={loggingOut}
            onClick={() => logout(false)}
          >
            Esci
          </Button>
        </Stack>
        {children}
      </Box>
    </ThemeProvider>
  );
}
