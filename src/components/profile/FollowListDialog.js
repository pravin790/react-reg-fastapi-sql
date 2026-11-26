import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

import { API_BASE_URL, api } from "../../services/api";

const USERS_PER_PAGE = 10;

function FollowListDialog({ profileId, listType, onClose, onOpenProfile }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");
  const contentRef = useRef(null);
  const observerTargetRef = useRef(null);
  const requestIdRef = useRef(0);
  const pageRef = useRef(0);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(false);

  const fetchPage = useCallback(
    async (page, requestId) => {
      if (loadingRef.current || requestId !== requestIdRef.current) {
        return;
      }

      loadingRef.current = true;
      setLoading(true);
      setError("");
      try {
        const data = await api.get(
          `/api/users/${encodeURIComponent(profileId)}/${listType}?page=${page}&limit=${USERS_PER_PAGE}`
        );
        if (requestId !== requestIdRef.current) {
          return;
        }

        const receivedUsers = data.users || [];
        setUsers((previousUsers) => {
          if (page === 1) {
            return receivedUsers;
          }

          const existingIds = new Set(previousUsers.map((user) => user.id));
          return [
            ...previousUsers,
            ...receivedUsers.filter((user) => !existingIds.has(user.id)),
          ];
        });
        pageRef.current = page;
        hasMoreRef.current = Boolean(data.hasMore);
        setHasMore(hasMoreRef.current);
      } catch (fetchError) {
        if (requestId === requestIdRef.current) {
          setError(fetchError.message || `Failed to load ${listType}`);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    },
    [listType, profileId]
  );

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    pageRef.current = 0;
    loadingRef.current = false;
    hasMoreRef.current = false;
    setUsers([]);
    setHasMore(false);
    setError("");

    if (!listType || !profileId) {
      setLoading(false);
      return undefined;
    }

    fetchPage(1, requestId);
    return () => {
      if (requestIdRef.current === requestId) {
        requestIdRef.current += 1;
        loadingRef.current = false;
      }
    };
  }, [fetchPage, listType, profileId]);

  useEffect(() => {
    const target = observerTargetRef.current;
    if (!listType || !target || !contentRef.current) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMoreRef.current &&
          !loadingRef.current &&
          !error
        ) {
          fetchPage(pageRef.current + 1, requestIdRef.current);
        }
      },
      { root: contentRef.current, threshold: 0.1 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [error, fetchPage, hasMore, listType, loading]);

  const handleRetry = () => {
    fetchPage(pageRef.current + 1, requestIdRef.current);
  };

  const title = listType === "followers" ? "Followers" : "Following";

  return (
    <Dialog
      open={Boolean(listType)}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent ref={contentRef} dividers sx={{ maxHeight: "60vh" }}>
        {error && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={handleRetry}>
                Retry
              </Button>
            }
            sx={{ mb: users.length ? 2 : 0 }}
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
            {listType === "followers"
              ? "No followers yet."
              : "Not following anyone yet."}
          </Typography>
        )}

        {users.length > 0 && (
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
                <Box
                  component="button"
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenProfile(user.id);
                  }}
                  sx={{
                    border: 0,
                    background: "none",
                    color: "inherit",
                    cursor: "pointer",
                    textAlign: "left",
                    p: 0,
                  }}
                >
                  <Typography fontWeight="bold">
                    {user.firstName} {user.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user.followersCount} followers · {user.followingCount} following
                  </Typography>
                </Box>
              </Box>
            ))}
            <div
              ref={observerTargetRef}
              aria-hidden="true"
              style={{ height: "10px", width: "100%" }}
            />
            {loading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
                <CircularProgress size={20} />
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default FollowListDialog;
