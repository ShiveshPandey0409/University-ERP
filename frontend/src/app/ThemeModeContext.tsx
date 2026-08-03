import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { CssBaseline, type PaletteMode } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";

import { buildTheme } from "./theme";

const STORAGE_KEY = "ptsnsu_theme_mode";

interface ColorModeCtx {
  mode: PaletteMode;
  toggle: () => void;
}

const ColorModeContext = createContext<ColorModeCtx>({ mode: "light", toggle: () => {} });

export const useColorMode = () => useContext(ColorModeContext);

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>(
    () => (localStorage.getItem(STORAGE_KEY) as PaletteMode) || "light",
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const theme = useMemo(() => buildTheme(mode), [mode]);
  const ctx = useMemo<ColorModeCtx>(
    () => ({ mode, toggle: () => setMode((m) => (m === "light" ? "dark" : "light")) }),
    [mode],
  );

  return (
    <ColorModeContext.Provider value={ctx}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
