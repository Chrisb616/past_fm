"use client";

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import { ToastProvider } from "@/components/toast";
import { theme } from "@/lib/theme";

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}
