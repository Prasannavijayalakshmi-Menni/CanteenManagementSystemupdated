import React, { useState } from "react";
import axios from "axios";

import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Tabs,
  Tab,
  InputAdornment,
  IconButton,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";

import {
  Visibility,
  VisibilityOff,
  Restaurant,
} from "@mui/icons-material";

const AuthPage = ({ onLogin }) => {
  const [mode, setMode] = useState(0); // 0 = Login, 1 = Register
  const [role, setRole] = useState("user");

  const [loginData, setLoginData] = useState({
    mobile: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState({
    name: "",
    mobile: "",
    password: "",
  });

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // ROLE NAME
  // =====================================================

  const getRoleName = () => {
    if (role === "user") return "User";
    if (role === "staff") return "Staff";
    if (role === "admin") return "Admin";

    return "User";
  };

  // =====================================================
  // ROLE CHANGE
  // =====================================================

  const handleRoleChange = (event, newRole) => {
    if (!newRole) return;

    setRole(newRole);
    setError("");
    setSuccess("");

    setLoginData({
      mobile: "",
      password: "",
    });

    setRegisterData({
      name: "",
      mobile: "",
      password: "",
    });
  };

  // =====================================================
  // LOGIN
  // =====================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await axios.post("/api/auth/login", {
        mobile: loginData.mobile,
        password: loginData.password,
        role: role,
      });

      const { token, user } = response.data;

      // Save authentication data
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Add token to future Axios requests
      axios.defaults.headers.common["Authorization"] =
        `Bearer ${token}`;

      // Send logged-in user to App.js
      onLogin(user);

    } catch (error) {
      console.error("Login error:", error);

      setError(
        error.response?.data?.message ||
          "Login failed. Please check your credentials."
      );

    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // REGISTER
  // =====================================================

  const handleRegister = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(
        "/api/auth/register",
        {
          name: registerData.name,
          mobile: registerData.mobile,
          password: registerData.password,
          role: role,
        }
      );

      setSuccess(
        response.data.message +
          ". You can now login."
      );

      // Clear registration form
      setRegisterData({
        name: "",
        mobile: "",
        password: "",
      });

      // Go back to Login
      setMode(0);

    } catch (error) {
      console.error("Registration error:", error);

      setError(
        error.response?.data?.message ||
          "Registration failed. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:
          "linear-gradient(135deg, #E8F5E9 0%, #F1F8E9 50%, #FFF3E0 100%)",
        p: 2,
      }}
    >

      <Paper
        elevation={10}
        sx={{
          width: "100%",
          maxWidth: 450,
          borderRadius: 4,
          overflow: "hidden",
        }}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <Box
          sx={{
            background:
              "linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)",
            color: "white",
            textAlign: "center",
            py: 4,
            px: 3,
          }}
        >

          <Restaurant
            sx={{
              fontSize: 55,
              mb: 1,
            }}
          />

          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
            }}
          >
            CanteenPro
          </Typography>

          <Typography
            variant="body1"
            sx={{
              opacity: 0.9,
              mt: 1,
            }}
          >
            Smart Food Ordering System
          </Typography>

        </Box>


        {/* =================================================
            LOGIN / REGISTER TABS
        ================================================= */}

        <Tabs
          value={mode}
          onChange={(event, newValue) => {
            setMode(newValue);
            setError("");
            setSuccess("");
          }}
          centered
          variant="fullWidth"
        >

          <Tab label="Login" />

          <Tab label="Register" />

        </Tabs>


        {/* =================================================
            ROLE SELECTOR
        ================================================= */}

        <Box
          sx={{
            px: 4,
            pt: 3,
          }}
        >

          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              color: "#2E7D32",
              mb: 1.5,
            }}
          >
            Select Account Type
          </Typography>


          <ToggleButtonGroup
            value={role}
            exclusive
            fullWidth
            onChange={handleRoleChange}
            sx={{
              "& .MuiToggleButton-root": {
                textTransform: "none",
                fontWeight: 600,
                borderColor: "#A5D6A7",
              },

              "& .Mui-selected": {
                backgroundColor:
                  "#E8F5E9 !important",

                color:
                  "#2E7D32 !important",

                borderColor:
                  "#2E7D32 !important",
              },
            }}
          >

            <ToggleButton value="user">
              User
            </ToggleButton>

            <ToggleButton value="staff">
              Staff
            </ToggleButton>

            <ToggleButton value="admin">
              Admin
            </ToggleButton>

          </ToggleButtonGroup>

        </Box>


        {/* =================================================
            FORM AREA
        ================================================= */}

        <Box sx={{ p: 4 }}>

          {/* ERROR */}

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
            >
              {error}
            </Alert>
          )}


          {/* SUCCESS */}

          {success && (
            <Alert
              severity="success"
              sx={{ mb: 2 }}
            >
              {success}
            </Alert>
          )}


          {/* =================================================
              LOGIN
          ================================================= */}

          {mode === 0 && (

            <Box
              component="form"
              onSubmit={handleLogin}
            >

              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  color: "#2E7D32",
                }}
              >
                {getRoleName()} Login
              </Typography>


              {/* MOBILE */}

              <TextField
                fullWidth
                label="Mobile Number"
                value={loginData.mobile}
                onChange={(e) =>
                  setLoginData({
                    ...loginData,
                    mobile: e.target.value,
                  })
                }
                required
                inputProps={{
                  maxLength: 10,
                  inputMode: "numeric",
                }}
                sx={{
                  mb: 2,
                }}
              />


              {/* PASSWORD */}

              <TextField
                fullWidth
                label="Password"
                type={
                  showLoginPassword
                    ? "text"
                    : "password"
                }
                value={loginData.password}
                onChange={(e) =>
                  setLoginData({
                    ...loginData,
                    password: e.target.value,
                  })
                }
                required
                sx={{
                  mb: 3,
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">

                      <IconButton
                        onClick={() =>
                          setShowLoginPassword(
                            !showLoginPassword
                          )
                        }
                        edge="end"
                      >

                        {showLoginPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}

                      </IconButton>

                    </InputAdornment>
                  ),
                }}
              />


              {/* LOGIN BUTTON */}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 700,

                  background:
                    "linear-gradient(135deg, #2E7D32, #4CAF50)",
                }}
              >

                {loading
                  ? "Logging in..."
                  : `Login as ${getRoleName()}`}

              </Button>

            </Box>
          )}


          {/* =================================================
              REGISTER
          ================================================= */}

          {mode === 1 && (

            <Box
              component="form"
              onSubmit={handleRegister}
            >

              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  color: "#2E7D32",
                }}
              >
                Create {getRoleName()} Account
              </Typography>


              {/* NAME */}

              <TextField
                fullWidth
                label="Full Name"
                value={registerData.name}
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    name: e.target.value,
                  })
                }
                required
                sx={{
                  mb: 2,
                }}
              />


              {/* MOBILE */}

              <TextField
                fullWidth
                label="Mobile Number"
                value={registerData.mobile}
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    mobile: e.target.value,
                  })
                }
                required
                inputProps={{
                  maxLength: 10,
                  inputMode: "numeric",
                }}
                sx={{
                  mb: 2,
                }}
              />


              {/* PASSWORD */}

              <TextField
                fullWidth
                label="Password"
                type={
                  showRegisterPassword
                    ? "text"
                    : "password"
                }
                value={registerData.password}
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    password: e.target.value,
                  })
                }
                required
                autoComplete="new-password"
                helperText="Password must contain at least 6 characters"
                sx={{
                  mb: 3,
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">

                      <IconButton
                        onClick={() =>
                          setShowRegisterPassword(
                            !showRegisterPassword
                          )
                        }
                        edge="end"
                      >

                        {showRegisterPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}

                      </IconButton>

                    </InputAdornment>
                  ),
                }}
              />


              {/* REGISTER BUTTON */}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 700,

                  background:
                    "linear-gradient(135deg, #2E7D32, #4CAF50)",
                }}
              >

                {loading
                  ? "Creating account..."
                  : `Create ${getRoleName()} Account`}

              </Button>

            </Box>
          )}

        </Box>

      </Paper>

    </Box>
  );
};

export default AuthPage;