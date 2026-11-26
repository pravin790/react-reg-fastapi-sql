import React, { useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import { API_BASE_URL, api } from "../services/api";
import { setStoredUser } from "../utils/authUtils";

function EditProfilePage({ user, setUser, onBackHome, onOpenProfile, onChangePassword }) {
  const userId = user?.id || user?._id;

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [address, setAddress] = useState(user?.address || "");
  const [image, setImage] = useState(null);

  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setAddress(user.address || "");
    }
  }, [user]);

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    setSavingProfile(true);

    try {
      if (firstName.trim().length < 3 || firstName.trim().length > 30) {
        throw new Error("First name must be between 3 and 30 characters.");
      }

      if (lastName.trim().length < 1 || lastName.trim().length > 30) {
        throw new Error("Last name must be between 1 and 30 characters.");
      }

      const formData = new FormData();
      formData.append("firstName", firstName.trim());
      formData.append("lastName", lastName.trim());
      formData.append("address", address || "");

      if (image) {
        formData.append("image", image);
      }

      const data = await api.putForm("/api/users/me/profile", formData);

      const updatedUser = {
        ...(user || {}),
        ...data.user,
      };

      setStoredUser(updatedUser, localStorage.getItem("token"));
      setUser(updatedUser);

      setProfileSuccess(data.message || "Profile updated successfully.");
      setImage(null);
    } catch (error) {
      setProfileError(error.message || "Unable to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const avatarSrc =
    image && typeof image === "string"
      ? `${API_BASE_URL}/${image.replace(/\\/g, "/")}`
      : image
        ? URL.createObjectURL(image)
        : user?.image
          ? `${API_BASE_URL}/${user.image.replace(/\\/g, "/")}`
          : undefined;

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: 3 }}>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="h4">Edit profile</Typography>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button variant="outlined" onClick={() => onOpenProfile(userId)}>
            My profile
          </Button>
        </Box>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box
          component="form"
          onSubmit={handleProfileSave}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Avatar
              src={avatarSrc}
              alt={`${firstName} ${lastName}`}
              sx={{ width: 72, height: 72 }}
            />
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                Profile photo
              </Typography>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  setImage(event.target.files[0] || null);
                }}
              />
            </Box>
          </Box>

          {profileError && <Alert severity="error">{profileError}</Alert>}

          {profileSuccess && <Alert severity="success">{profileSuccess}</Alert>}

          <TextField
            label="First name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            fullWidth
            required
          />

          <TextField
            label="Last name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            fullWidth
            required
          />

          <TextField
            label="Address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            multiline
            rows={3}
            fullWidth
          />

          <Button
            type="submit"
            variant="contained"
            disabled={savingProfile}
            sx={{ alignSelf: "flex-start" }}
          >
            {savingProfile ? "Saving..." : "Save profile"}
          </Button>
        </Box>
      </Paper>

    </Box>
  );
}

export default EditProfilePage;
