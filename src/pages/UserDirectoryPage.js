import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";

import { API_BASE_URL, api } from "../services/api";

const USERS_PER_PAGE = 10;

function UserDirectoryPage({ onOpenProfile, onBackHome }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const isFetchingUsers = useRef(false);
  const observerTarget = useRef(null);

  const fetchUsers = useCallback(async (requestedPage = 1) => {
    if (isFetchingUsers.current) {
      return;
    }

    try {
      isFetchingUsers.current = true;
      setLoading(true);
      setError("");
      const data = await api.get(
        `/api/users?page=${requestedPage}&limit=${USERS_PER_PAGE}`
      );
      const receivedUsers = data.users || [];

      if (requestedPage === 1) {
        setUsers(receivedUsers);
      } else {
        setUsers((previousUsers) => {
          const existingUserIds = new Set(
            previousUsers.map((user) => user.id)
          );
          return [
            ...previousUsers,
            ...receivedUsers.filter((user) => !existingUserIds.has(user.id)),
          ];
        });
      }

      setPage(requestedPage);
      setHasMoreUsers(requestedPage < (data.totalPages || 1));
    } catch (fetchError) {
      setError(fetchError.message || "Failed to load users");
    } finally {
      isFetchingUsers.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleLoadMoreUsers = useCallback(() => {
    if (!loading && hasMoreUsers && !isFetchingUsers.current) {
      fetchUsers(page + 1);
    }
  }, [loading, hasMoreUsers, page, fetchUsers]);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMoreUsers();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);
    return () => observer.unobserve(target);
  }, [handleLoadMoreUsers]);

  const handleFollowToggle = async (user) => {
    if (updatingUserId) {
      return;
    }

    setUpdatingUserId(user.id);
    setError("");
    try {
      const endpoint = `/api/users/${user.id}/follow`;
    const data =
      user.isFollowing || user.isFollowRequested
        ? await api.delete(endpoint)
        : await api.post(endpoint, {});

      setUsers((previousUsers) =>
        previousUsers.map((currentUser) =>
          currentUser.id === user.id
            ? {
                ...currentUser,
                isFollowing: data.isFollowing,
                isFollowRequested: data.isFollowRequested,
                followersCount: data.followersCount,
              }
            : currentUser
        )
      );
    } catch (followError) {
      setError(followError.message || "Failed to update follow status");
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
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
        <Typography variant="h4">Find users</Typography>
        <Button variant="outlined" onClick={onBackHome}>
          Back to posts
        </Button>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && users.length === 0 && !error && (
        <Typography color="text.secondary">No other users found.</Typography>
      )}

      <Box sx={{ display: "grid", gap: 2 }}>
        {users.map((user) => (
          <Paper
            key={user.id}
            elevation={2}
            sx={{
              p: 2,
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Avatar
              src={
                user.image
                  ? `${API_BASE_URL}/${user.image.replace(/\\/g, "/")}`
                  : undefined
              }
              alt={`${user.firstName} ${user.lastName}`}
              sx={{ width: 56, height: 56 }}
            />
            <Box sx={{ flex: 1, minWidth: 180 }}>
              <Typography variant="h6">
                {user.firstName} {user.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.followersCount} followers · {user.followingCount} following
              </Typography>
            </Box>
            <Button
              variant="text"
              onClick={() => onOpenProfile(user.id)}
            >
              View profile
            </Button>
            <Button
              variant={
                user.isFollowing || user.isFollowRequested
                  ? "outlined"
                  : "contained"
              }
              disabled={updatingUserId === user.id}
              onClick={() => handleFollowToggle(user)}
            >
              {user.isFollowing
                ? "Following"
                : user.isFollowRequested
                  ? "Requested"
                  : "Follow"}
            </Button>
          </Paper>
        ))}
      </Box>

      <Box
        sx={{
          minHeight: 50,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          my: 3,
        }}
      >
        <div ref={observerTarget} style={{ height: "10px", width: "100%" }} />
        {loading && <CircularProgress size={24} />}
        {!loading && !hasMoreUsers && users.length > 0 && (
          <Typography
            color="text.secondary"
            sx={{ width: "100%", textAlign: "center" }}
          >
            No more users to load.
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default UserDirectoryPage;
