import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
} from "@mui/material";

import { api } from "../../services/api";
import { setStoredUser } from "../../utils/authUtils";
import { isValidEmail } from "../../utils/validation";

function Login({ setUser, onBackToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setError("Email and password are required.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const data = await api.post("/api/login", {
        email: trimmedEmail,
        password,
      });

      if (!data.user) {
        setError("Login succeeded, but user data was not returned.");
        return;
      }

      const authenticatedUser = {
        ...data.user,
        token: data.token,
      };

      setStoredUser(authenticatedUser, data.token);
      setUser(authenticatedUser);
    } catch (loginError) {
      console.error("Login request error:", loginError);
      setError(
        loginError.message ||
          "Unable to connect to server. Check the backend URL and server status."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
        padding: 2,
      }}
    >
      <Paper
        elevation={4}
        sx={{
          width: "100%",
          maxWidth: 450,
          padding: 4,
          borderRadius: 3,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            textAlign: "center",
            width: "100%",
            fontWeight: "bold",
            marginBottom: 3,
          }}
        >
          Login
        </Typography>

        {error && (
          <Alert severity="error" sx={{ marginBottom: 2 }}>
            {error}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleLogin}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            fullWidth
          />

          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            fullWidth
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>

          <Button
            type="button"
            variant="text"
            onClick={onBackToRegister}
          >
            Back to Register
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default Login;