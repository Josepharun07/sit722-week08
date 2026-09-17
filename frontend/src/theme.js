import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#17d8dfc2",
    },
    secondary: {
      main: "#5600f7",
    },
    background: {
      default: "#f5f5f5",
    },
  },

  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
  },

  shape: {
    borderRadius: 8,
  },
});

export default theme;