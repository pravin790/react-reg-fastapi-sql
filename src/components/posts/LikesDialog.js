import React, { useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
} from "@mui/material";

function LikesDialog({
  likesPost,
  onClose,
  likedUsers,
  likesLoading,
  likesError,
  hasMoreLikes,
  onLoadMoreLikes,
}) {
  const likesObserverRef = useRef(null);

  useEffect(() => {
    const target = likesObserverRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreLikes && !likesLoading) {
          if (onLoadMoreLikes) {
            onLoadMoreLikes();
          }
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasMoreLikes, likesLoading, onLoadMoreLikes]);

  return (
    <Dialog
      open={Boolean(likesPost)}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>People who liked {likesPost?.title}</DialogTitle>
      <DialogContent dividers>
        {likesLoading && likedUsers.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress size={26} />
          </Box>
        )}

        {likesError && <Alert severity="error">{likesError}</Alert>}

        {!likesLoading && !likesError && likedUsers.length === 0 && (
          <Typography color="text.secondary">No likes yet.</Typography>
        )}

        {likedUsers.length > 0 && (
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {likedUsers.map((likedUser) => (
              <Box key={likedUser._id}>
                <Typography fontWeight="bold">
                  {likedUser.firstName} {likedUser.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {likedUser.email}
                </Typography>
              </Box>
            ))}

            {/* Infinite scroll sentinel */}
            <div ref={likesObserverRef} style={{ height: "10px", width: "100%" }} />

            {likesLoading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 1.5 }}>
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

export default LikesDialog;
