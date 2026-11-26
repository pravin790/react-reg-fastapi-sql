import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from "@mui/material";

import { API_BASE_URL, api } from "../../services/api";

const USERS_PER_PAGE = 10;

function BlockedUsersDialog({ open, onClose, onOpenProfile }) {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [error, setError] = useState("");
  const [userToUnblock, setUserToUnblock] = useState(null);

  const fetchPage = useCallback(async (requestedPage) => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get(
        `/api/users/me/blocked?page=${requestedPage}&limit=${USERS_PER_PAGE}`
      );
      setUsers((previousUsers) => {
        if (requestedPage === 1) {
          return data.users || [];
        }
        const existingIds = new Set(previousUsers.map((user) => user.id));
        return [
          ...previousUsers,
          ...(data.users || []).filter((user) => !existingIds.has(user.id)),
        ];
      });
      setPage(requestedPage);
      setHasMore(Boolean(data.hasMore));
    } catch (fetchError) {
      setError(fetchError.message || "Failed to load blocked users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setUsers([]);
      setPage(0);
      setHasMore(false);
      fetchPage(1);
    }
  }, [fetchPage, open]);

  const handleUnblock = async () => {
    const user = userToUnblock;
    if (updatingUserId) {
      return;
    }

    setUpdatingUserId(user.id);
    setError("");
    try {
      await api.delete(`/api/users/${encodeURIComponent(user.id)}/block`);
      setUsers((previousUsers) =>
        previousUsers.filter((blockedUser) => blockedUser.id !== user.id)
      );
      setUserToUnblock(null);
    } catch (unblockError) {
      setError(unblockError.message || "Failed to unblock user");
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Blocked users</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert
            severity="error"
            action={
              page === 0 ? (
                <Button color="inherit" size="small" onClick={() => fetchPage(1)}>
                  Retry
                </Button>
              ) : null
            }
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>
        )}

        {loading && users.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress size={26} />
          </Box>
        )}

        {!loading && !error && users.length === 0 && (
          <Typography color="text.secondary">
            You haven’t blocked anyone.
          </Typography>
        )}

        <Box sx={{ display: "grid", gap: 1.5 }}>
          {users.map((user) => (
            <Box
              key={user.id}
              sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
            >
              <Avatar
                src={
                  user.image
                    ? `${API_BASE_URL}/${user.image.replace(/\\/g, "/")}`
                    : undefined
                }
                alt={`${user.firstName} ${user.lastName}`}
              />
              <Button
                onClick={() => {
                  onClose();
                  onOpenProfile(user.id);
                }}
                sx={{
                  flex: 1,
                  justifyContent: "flex-start",
                  color: "text.primary",
                  textTransform: "none",
                }}
              >
                {user.firstName} {user.lastName}
              </Button>
              <Button
                variant="outlined"
                disabled={Boolean(updatingUserId)}
                onClick={() => setUserToUnblock(user)}
              >
                Unblock
              </Button>
            </Box>
          ))}
        </Box>

        {loading && users.length > 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
            <CircularProgress size={20} />
          </Box>
        )}

        {hasMore && !loading && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <Button onClick={() => fetchPage(page + 1)}>Load more</Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
      <Dialog
        open={Boolean(userToUnblock)}
        onClose={() => {
          if (!updatingUserId) {
            setUserToUnblock(null);
          }
        }}
      >
        <DialogTitle>Unblock user?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to unblock{" "}
            {userToUnblock
              ? `${userToUnblock.firstName} ${userToUnblock.lastName}`
              : ""}
            ?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setUserToUnblock(null)}
            disabled={Boolean(updatingUserId)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUnblock}
            disabled={Boolean(updatingUserId)}
            autoFocus
          >
            {updatingUserId ? "Unblocking..." : "Unblock"}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}

export default BlockedUsersDialog;
