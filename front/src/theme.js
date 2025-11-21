import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#03ABEE', // Light blue from CSS
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#042C3C', // Dark blue background from CSS
    },
    background: {
      default: '#f4f6f8', // Light grey for main content area
      paper: '#ffffff',
    },
    text: {
      primary: '#042C3C',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Segoe UI", "Tahoma", "Geneva", "Verdana", "sans-serif"',
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#042C3C',
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#042C3C',
          color: '#ffffff',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#03ABEE',
          },
          '&.Mui-selected': {
            backgroundColor: '#03ABEE',
            '&:hover': {
              backgroundColor: '#03ABEE',
            },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: '#ffffff',
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: '#ffffff',
        },
      },
    },
  },
});

export default theme;
