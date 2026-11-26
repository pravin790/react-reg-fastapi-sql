import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

import { api } from "../../services/api";

function DeletePostDialog({
  post,
  onClose,
  currentUserId,
  onPostDeleted,
  onError,
}) {
  const [actionLoading, setActionLoading] = useState(false);

  const handleDeletePost = async () => {
    if (!post) return;

    try {
      setActionLoading(true);
      await api.delete(`/api/posts/${post._id}`, {
        userId: currentUserId,
      });

      onClose();
      if (onPostDeleted) {
        await onPostDeleted();
      }
    } catch (actionError) {
      if (onError) {
        onError(actionError.message || "Failed to delete post");
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Dialog
      open={Boolean(post)}
      onClose={() => !actionLoading && onClose()}
    >
      <DialogTitle>Delete post?</DialogTitle>
      <DialogContent>
        <Typography>Are you sure you want to delete this post?</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={actionLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleDeletePost}
          color="error"
          variant="contained"
          disabled={actionLoading}
        >
          {actionLoading ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DeletePostDialog;

