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
import {
  isStrongPassword,
  isValidEmail,
  PASSWORD_VALIDATION_MESSAGE,
} from "../../utils/validation";

function RegisterForm({ onShowLogin }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [address, setAddress] = useState("");
  const [image, setImage] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (firstName.trim().length < 3 || firstName.trim().length > 30) {
      setError("First name must be between 3 and 30 characters.");
      return;
    }

    if (lastName.trim().length < 1 || lastName.trim().length > 30) {
      setError("Last name must be between 1 and 30 characters.");
      return;
    }

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!isStrongPassword(password)) {
      setError(PASSWORD_VALIDATION_MESSAGE);
      return;
    }

    try {
      const formData = new FormData();

      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("email", trimmedEmail);
      formData.append("password", password);
      formData.append("address", address);

      if (image) {
        formData.append("image", image);
      }

      await api.postForm("/api/register", formData);

      setSuccess("Registration successful. You can now login.");

      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setAddress("");
      setImage(null);

      setTimeout(() => {
        if (onShowLogin) {
          onShowLogin();
        }
        setSuccess("");
      }, 1000);
    } catch (registerError) {
      console.error("Registration error:", registerError);
      setError(registerError.message || "Unable to connect to server.");
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
          maxWidth: 500,
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
          Registration
        </Typography>

        {error && (
          <Alert severity="error" sx={{ marginBottom: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ marginBottom: 2 }}>
            {success}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleRegister}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <TextField
            label="First Name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
            fullWidth
          />

          <TextField
            label="Last Name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            required
            fullWidth
          />

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

          <TextField
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            fullWidth
          />

          <TextField
            label="Address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            multiline
            rows={3}
            fullWidth
          />

          <Box>
            <Typography variant="body2" sx={{ marginBottom: 1 }}>
              Profile Image
            </Typography>

            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                setImage(event.target.files[0] || null);
              }}
            />
          </Box>

          <Button type="submit" variant="contained" size="large" fullWidth>
            Register
          </Button>

          <Button
            type="button"
            variant="text"
            onClick={() => {
              setError("");
              setSuccess("");
              if (onShowLogin) {
                onShowLogin();
              }
            }}
          >
            Already have an account? Login
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default RegisterForm;
