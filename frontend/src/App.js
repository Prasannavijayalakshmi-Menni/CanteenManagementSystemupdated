import React, { useState } from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
} from "@mui/material";

import AuthPage from "./components/AuthPage";
import UserDashboard from "./components/UserDashboard";
import StaffDashboard from "./components/StaffDashboard";
import AdminDashboard from "./components/AdminDashboard";

/*
=========================================================
CANTEENPRO APPLICATION
=========================================================

Current responsibility of App.js:

1. Check whether user is logged in
2. Show AuthPage when not logged in
3. Route USER to UserDashboard
4. Route STAFF to StaffDashboard
5. Route ADMIN to AdminDashboard
6. Handle logout
=========================================================
*/

const theme = createTheme({
  palette: {
    primary: {
      main: "#2E7D32",
    },

    secondary: {
      main: "#FF9800",
    },

    background: {
      default: "#F5F7F5",
    },
  },

  typography: {
    fontFamily:
      '"Roboto", "Helvetica", "Arial", sans-serif',
  },

  shape: {
    borderRadius: 12,
  },
});

function App() {
  /*
  ========================================================
  LOAD SAVED USER
  ========================================================
  */

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      return null;
    }

    try {
      return JSON.parse(savedUser);
    } catch (error) {
      console.error(
        "Invalid saved user data:",
        error
      );

      localStorage.removeItem("user");
      localStorage.removeItem("token");

      return null;
    }
  });

  /*
  ========================================================
  LOGIN
  ========================================================
  */

  const handleLogin = (loggedInUser) => {
    console.log(
      "Logged in user:",
      loggedInUser
    );

    setUser(loggedInUser);

    localStorage.setItem(
      "user",
      JSON.stringify(loggedInUser)
    );
  };

  /*
  ========================================================
  LOGOUT
  ========================================================
  */

  const handleLogout = () => {
    console.log("Logging out...");

    localStorage.removeItem("user");
    localStorage.removeItem("token");

    setUser(null);
  };

  /*
  ========================================================
  NOT LOGGED IN
  ========================================================
  */

  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />

        <AuthPage
          onLogin={handleLogin}
        />
      </ThemeProvider>
    );
  }

  /*
  ========================================================
  USER
  ========================================================
  */

  if (user.role === "user") {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />

        <UserDashboard
          user={user}
          onLogout={handleLogout}
        />
      </ThemeProvider>
    );
  }

  /*
  ========================================================
  STAFF
  ========================================================
  */

  if (user.role === "staff") {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />

        <StaffDashboard
          user={user}
          onLogout={handleLogout}
        />
      </ThemeProvider>
    );
  }

  /*
  ========================================================
  ADMIN
  ========================================================
  */

  if (user.role === "admin") {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />

        <AdminDashboard
          user={user}
          onLogout={handleLogout}
        />
      </ThemeProvider>
    );
  }

  /*
  ========================================================
  INVALID ROLE
  ========================================================
  */

  console.warn(
    "Unknown user role:",
    user.role
  );

  localStorage.removeItem("user");
  localStorage.removeItem("token");

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <AuthPage
        onLogin={handleLogin}
      />
    </ThemeProvider>
  );
}

export default App;