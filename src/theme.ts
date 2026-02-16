import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#5b6df6',
      dark: '#4558e8',
    },
    error: {
      main: '#ea4335',
    },
    success: {
      main: '#1f9d55',
    },
    background: {
      default: '#eef2ff',
      paper: '#ffffff',
    },
    text: {
      primary: '#121826',
      secondary: '#667085',
    },
    divider: '#e6eaf2',
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    button: {
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*, *::before, *::after': {
          boxSizing: 'border-box',
        },
        'html, body, #root': {
          height: '100%',
          overflow: 'hidden',
        },
        body: {
          margin: 0,
          background: 'radial-gradient(circle at 15% 20%, #f2f6ff 0%, #eef2ff 45%, #e9eefb 100%)',
          overscrollBehavior: 'none',
          WebkitTapHighlightColor: 'transparent',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        '@supports (-webkit-touch-callout: none)': {
          body: {
            height: '-webkit-fill-available',
          },
        },
        button: {
          fontFamily: 'inherit',
          WebkitTapHighlightColor: 'transparent',
        },
        '.recipe-swiper': {
          WebkitOverflowScrolling: 'touch',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          fontWeight: 500,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 18,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
  },
});

export default theme;
