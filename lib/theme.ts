import { createTheme } from "@mui/material/styles";

const moonlight = "#E8EEF8";
const moonlightSoft = "#C5D0E8";
const dusk = "#07091A";
const duskRaised = "#12162B";
const duskField = "#1A2040";
const amethyst = "#8B7BC8";
const amethystDeep = "#5C4E9A";
const steelBlue = "#5B7FBF";

export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "dark",
    primary: {
      main: moonlight,
      light: "#F4F7FC",
      dark: moonlightSoft,
      contrastText: dusk,
    },
    secondary: {
      main: amethyst,
      light: "#A99BE0",
      dark: amethystDeep,
      contrastText: moonlight,
    },
    info: {
      main: steelBlue,
      contrastText: moonlight,
    },
    error: {
      main: "#E08090",
    },
    warning: {
      main: "#E0C080",
    },
    success: {
      main: "#7EBEA8",
    },
    background: {
      default: dusk,
      paper: duskRaised,
    },
    text: {
      primary: moonlight,
      secondary: moonlightSoft,
      disabled: "rgba(232, 238, 248, 0.38)",
    },
    divider: "rgba(232, 238, 248, 0.14)",
    action: {
      hover: "rgba(139, 123, 200, 0.12)",
      selected: "rgba(91, 127, 191, 0.2)",
      focus: "rgba(232, 238, 248, 0.16)",
      disabled: "rgba(232, 238, 248, 0.3)",
      disabledBackground: "rgba(232, 238, 248, 0.08)",
    },
  },
  typography: {
    fontFamily: "var(--font-geist-sans), Helvetica, Arial, sans-serif",
    h3: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 700,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
      letterSpacing: "0.01em",
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: dusk,
          backgroundImage: [
            "radial-gradient(ellipse 90% 55% at 50% -20%, rgba(92, 78, 154, 0.38), transparent 60%)",
            "radial-gradient(ellipse 55% 45% at 100% 110%, rgba(45, 70, 140, 0.28), transparent 55%)",
          ].join(", "),
          backgroundAttachment: "fixed",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
          paddingInline: 18,
        },
        outlined: {
          borderColor: "rgba(232, 238, 248, 0.45)",
          "&:hover": {
            borderColor: moonlight,
            backgroundColor: "rgba(139, 123, 200, 0.12)",
          },
        },
        contained: {
          "&:hover": {
            backgroundColor: moonlightSoft,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: moonlightSoft,
          "&:hover": {
            backgroundColor: "rgba(139, 123, 200, 0.16)",
          },
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(232, 238, 248, 0.12)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: duskField,
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(232, 238, 248, 0.45)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: moonlight,
          },
        },
        notchedOutline: {
          borderColor: "rgba(232, 238, 248, 0.22)",
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: moonlightSoft,
          "&.Mui-focused": {
            color: moonlight,
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          "&.Mui-selected": {
            backgroundColor: "rgba(91, 127, 191, 0.22)",
            "&:hover": {
              backgroundColor: "rgba(91, 127, 191, 0.32)",
            },
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: `1px solid ${moonlightSoft}`,
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: moonlight,
        },
      },
    },
  },
});
