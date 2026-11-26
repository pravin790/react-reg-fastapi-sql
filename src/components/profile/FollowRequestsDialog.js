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

const REQUESTS_PER_PAGE = 10;

function FollowRequestsDialog({
  profileId,
  open,
  onClose,
  onRequestResponded,
}) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingRequesterId, setUpdatingRequesterId] = useState(null);
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
          `/api/users/${encodeURIComponent(
            profileId
          )}/follow-requests?page=${page}&limit=${REQUESTS_PER_PAGE}`
        );
        if (requestId !== requestIdRef.current) {
          return;
        }

        const receivedRequests = data.requests || [];
        setRequests((previousRequests) => {
          if (page === 1) {
            return receivedRequests;
          }

          const existingIds = new Set(
            previousRequests.map((requester) => requester.id)
          );
          return [
            ...previousRequests,
            ...receivedRequests.filter(
              (requester) => !existingIds.has(requester.id)
            ),
          ];
        });
        pageRef.current = page;
        hasMoreRef.current = Boolean(data.hasMore);
        setHasMore(hasMoreRef.current);
      } catch (fetchError) {
        if (requestId === requestIdRef.current) {
          setError(fetchError.message || "Failed to load follow requests");
        }
      } finally {
        if (requestId === requestIdRef.current) {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    },
    [profileId]
  );

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    pageRef.current = 0;
    loadingRef.current = false;
    hasMoreRef.current = false;
    setRequests([]);
    setHasMore(false);
    setError("");

    if (!open || !profileId) {
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
  }, [fetchPage, open, profileId]);

  useEffect(() => {
    const target = observerTargetRef.current;
    if (!open || !target || !contentRef.current) {
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
  }, [error, fetchPage, hasMore, loading, open]);

  const handleRetry = () => {
    fetchPage(pageRef.current + 1, requestIdRef.current);
  };

  const handleRespond = async (requester, accept) => {
    if (updatingRequesterId) {
      return;
    }

    setUpdatingRequesterId(requester.id);
    setError("");
    try {
      const endpoint = `/api/users/${encodeURIComponent(
        profileId
      )}/follow-requests/${encodeURIComponent(requester.id)}`;
      const result = accept
        ? await api.post(`${endpoint}/accept`, {})
        : await api.delete(endpoint);
      onRequestResponded?.({
        accepted: accept,
        followersCount: result.followersCount,
      });
      pageRef.current = 0;
      hasMoreRef.current = false;
      setRequests([]);
      setHasMore(false);
      fetchPage(1, requestIdRef.current);
    } catch (requestError) {
      setError(requestError.message || "Failed to update follow request");
    } finally {
      setUpdatingRequesterId(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Follow requests</DialogTitle>
      <DialogContent ref={contentRef} dividers sx={{ maxHeight: "60vh" }}>
        {error && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={handleRetry}>
                Retry
              </Button>
            }
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>
        )}
        {loading && requests.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress size={26} />
          </Box>
        )}
        {!loading && !error && requests.length === 0 && (
          <Typography color="text.secondary">
            You have no pending follow requests.
          </Typography>
        )}
        <Box sx={{ display: "grid", gap: 2 }}>
          {requests.map((requester) => (
            <Box
              key={requester.id}
              sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
            >
              <Avatar
                src={
                  requester.image
                    ? `${API_BASE_URL}/${requester.image.replace(/\\/g, "/")}`
                    : undefined
                }
                alt={`${requester.firstName} ${requester.lastName}`}
              />
              <Typography sx={{ flex: 1 }}>
                {requester.firstName} {requester.lastName}
              </Typography>
              <Button
                disabled={Boolean(updatingRequesterId) || loading}
                onClick={() => handleRespond(requester, false)}
              >
                Decline
              </Button>
              <Button
                variant="contained"
                disabled={Boolean(updatingRequesterId) || loading}
                onClick={() => handleRespond(requester, true)}
              >
                Accept
              </Button>
            </Box>
          ))}
          <div
            ref={observerTargetRef}
            aria-hidden="true"
            style={{ height: "10px", width: "100%" }}
          />
        </Box>
        {loading && requests.length > 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
            <CircularProgress size={20} />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default FollowRequestsDialog;
