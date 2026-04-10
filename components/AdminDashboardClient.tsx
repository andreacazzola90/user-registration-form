"use client";

import { Box, ThemeProvider, createTheme } from "@mui/material";
import type React from "react";

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
  children: React.ReactNode;
};

export function AdminDashboardClient({ children }: Props) {
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
        {children}
      </Box>
    </ThemeProvider>
  );
}
