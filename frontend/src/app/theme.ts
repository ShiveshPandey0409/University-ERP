import { alpha, createTheme, type PaletteMode, type Theme } from "@mui/material/styles";

const CARD_SHADOW_LIGHT = "0 1px 2px rgba(16,24,40,0.04), 0 8px 24px -12px rgba(16,24,40,0.12)";
const CARD_SHADOW_DARK = "0 1px 2px rgba(0,0,0,0.4), 0 12px 28px -14px rgba(0,0,0,0.6)";

export function buildTheme(mode: PaletteMode): Theme {
  const isLight = mode === "light";
  const primaryMain = "#4f46e5"; // indigo
  const divider = isLight ? "#e8eaf1" : "rgba(255,255,255,0.09)";
  const paper = isLight ? "#ffffff" : "#151a23";
  const defaultBg = isLight ? "#f6f7fb" : "#0b0e14";
  const textPrimary = isLight ? "#1a2233" : "#e6e9ef";
  const textSecondary = isLight ? "#5b6472" : "#9aa4b2";
  const cardShadow = isLight ? CARD_SHADOW_LIGHT : CARD_SHADOW_DARK;

  return createTheme({
    palette: {
      mode,
      primary: { main: primaryMain, light: "#6366f1", dark: "#4338ca", contrastText: "#fff" },
      secondary: { main: "#0d9488", light: "#14b8a6", dark: "#0f766e", contrastText: "#fff" },
      success: { main: "#16a34a" },
      warning: { main: "#d97706" },
      error: { main: "#dc2626" },
      info: { main: "#2563eb" },
      background: { default: defaultBg, paper },
      text: { primary: textPrimary, secondary: textSecondary },
      divider,
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: '"Inter Variable", Inter, Roboto, system-ui, -apple-system, "Segoe UI", sans-serif',
      h4: { fontWeight: 700, letterSpacing: -0.4 },
      h5: { fontWeight: 700, letterSpacing: -0.3 },
      h6: { fontWeight: 700, letterSpacing: -0.2 },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      button: { fontWeight: 600, textTransform: "none" },
      caption: { color: textSecondary },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          "*::-webkit-scrollbar": { width: 10, height: 10 },
          "*::-webkit-scrollbar-thumb": {
            backgroundColor: isLight ? "#cbd2e0" : "#2a313d",
            borderRadius: 8,
            border: `2px solid ${paper}`,
          },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: `1px solid ${divider}`,
            boxShadow: cardShadow,
            backgroundImage: "none",
            transition: "transform .2s ease, box-shadow .2s ease",
          },
        },
      },
      MuiPaper: { styleOverrides: { rounded: { borderRadius: 14 } } },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 10, paddingInline: 16 },
          containedPrimary: {
            background: "linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)",
            "&:hover": { background: "linear-gradient(135deg,#4f46e5 0%,#4338ca 100%)" },
          },
        },
      },
      MuiTextField: { defaultProps: { size: "small" } },
      MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 10 } } },
      MuiChip: { styleOverrides: { root: { fontWeight: 600, borderRadius: 8 } } },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: alpha(paper, isLight ? 0.85 : 0.8),
            backdropFilter: "blur(10px)",
            color: textPrimary,
            borderBottom: `1px solid ${divider}`,
            boxShadow: "none",
          },
        },
      },
      MuiDrawer: { styleOverrides: { paper: { borderRight: `1px solid ${divider}`, backgroundColor: paper } } },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            "&.Mui-selected": {
              backgroundColor: alpha(primaryMain, isLight ? 0.1 : 0.22),
              color: primaryMain,
              "&:hover": { backgroundColor: alpha(primaryMain, isLight ? 0.14 : 0.28) },
              "& .MuiListItemIcon-root": { color: primaryMain },
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: { fontWeight: 700, color: textSecondary, backgroundColor: isLight ? "#fafbff" : "#1a1f29" },
          root: { borderColor: divider },
        },
      },
      MuiTabs: { styleOverrides: { indicator: { height: 3, borderRadius: 3 } } },
      MuiTab: { styleOverrides: { root: { textTransform: "none", fontWeight: 600, minHeight: 44 } } },
      MuiTooltip: { styleOverrides: { tooltip: { borderRadius: 8, fontSize: 12 } } },
    },
  });
}
