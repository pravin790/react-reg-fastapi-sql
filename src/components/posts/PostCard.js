import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";

import { API_BASE_URL } from "../../services/api";
import { isVideoMedia } from "../../utils/mediaUtils";

function PostCard({
  post,
  currentUserId,
  onEdit,
  onDelete,
  onLikeToggle,
  isLikeUpdating,
  onOpenLikes,
  onOpenComments,
  isCommentsLoading,
}) {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);

  const postUserId = post.user?.id || post.user?._id || post.user;
  const isPostOwner =
    postUserId &&
    currentUserId &&
    postUserId.toString() === currentUserId.toString();

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "";
    }
    return new Date(dateValue).toLocaleString();
  };

  const movePostImage = (direction) => {
    const imageCount = post.images?.length || 1;
    setImageIndex((prevIndex) => (prevIndex + direction + imageCount) % imageCount);
  };

  const currentImage = Math.min(imageIndex, (post.images?.length || 1) - 1);
  const likedByCurrentUser = post.likedByCurrentUser;

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        mb: 3,
        position: "relative",
      }}
    >
      {isPostOwner && (
        <>
          <IconButton
            aria-label="Post options"
            onClick={(event) => setMenuAnchor(event.currentTarget)}
            sx={{ position: "absolute", top: 8, right: 8 }}
          >
            <span aria-hidden="true">⋮</span>
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
          >
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                if (onEdit) onEdit(post);
              }}
            >
              Edit
            </MenuItem>
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                if (onDelete) onDelete(post);
              }}
            >
              Delete
            </MenuItem>
          </Menu>
        </>
      )}

      <Typography variant="h5" sx={{ mb: 1 }}>
        {post.title}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Posted by:{" "}
        {post.user
          ? `${post.user.firstName} ${post.user.lastName}`
          : "Unknown user"}
      </Typography>

      {post.createdAt && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {formatDate(post.createdAt)}
        </Typography>
      )}

      {post.images?.length > 0 && (
        <Box sx={{ position: "relative", mb: 2 }}>
          {isVideoMedia(post.images[currentImage]) ? (
            <Box
              component="video"
              src={`${API_BASE_URL}/${post.images[currentImage].replace(/\\/g, "/")}`}
              controls
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
              sx={{
                width: "100%",
                maxHeight: 520,
                height: "auto",
                objectFit: "contain",
                borderRadius: 2,
                display: "block",
              }}
            />
          ) : (
            <Box
              component="img"
              src={`${API_BASE_URL}/${post.images[currentImage].replace(/\\/g, "/")}`}
              alt={`${post.title} ${currentImage + 1}`}
              sx={{
                width: "100%",
                maxHeight: 520,
                height: "auto",
                objectFit: "contain",
                borderRadius: 2,
                display: "block",
                cursor: "zoom-in",
              }}
            />
          )}

          {post.images.length > 1 && (
            <>
              <Button
                aria-label="Previous post image"
                onClick={() => movePostImage(-1)}
                sx={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  minWidth: 44,
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  color: "common.white",
                  backgroundColor: "rgba(0, 0, 0, 0.55)",
                  fontSize: "1.5rem",
                }}
              >
                ‹
              </Button>
              <Button
                aria-label="Next post image"
                onClick={() => movePostImage(1)}
                sx={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  minWidth: 44,
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  color: "common.white",
                  backgroundColor: "rgba(0, 0, 0, 0.55)",
                  fontSize: "1.5rem",
                }}
              >
                ›
              </Button>
              <Typography
                variant="body2"
                sx={{
                  position: "absolute",
                  bottom: 12,
                  left: "50%",
                  transform: "translateX(-50%)",
                  px: 1,
                  borderRadius: 1,
                  color: "common.white",
                  backgroundColor: "rgba(0, 0, 0, 0.55)",
                }}
              >
                {currentImage + 1} / {post.images.length}
              </Typography>
            </>
          )}
        </Box>
      )}

      <Box
        sx={{
          overflowWrap: "anywhere",
          "& img": {
            maxWidth: "100%",
          },
        }}
        dangerouslySetInnerHTML={{
          __html: post.description,
        }}
      />

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
        <Button
          size="small"
          variant={likedByCurrentUser ? "contained" : "outlined"}
          onClick={() => onLikeToggle && onLikeToggle(post)}
          disabled={isLikeUpdating}
          aria-label={likedByCurrentUser ? "Unlike post" : "Like post"}
        >
          {likedByCurrentUser ? "Unlike" : "Like"}
        </Button>
        <Button
          size="small"
          onClick={() => onOpenLikes && onOpenLikes(post)}
          aria-label={`View users who liked ${post.title}`}
        >
          {post.likesCount || 0} {post.likesCount === 1 ? "like" : "likes"}
        </Button>
      </Box>

      <Box sx={{ mt: 3, borderTop: "1px solid", borderColor: "divider", pt: 2 }}>
        <Button
          size="small"
          onClick={() => onOpenComments && onOpenComments(post._id)}
          disabled={isCommentsLoading}
        >
          {post.commentsCount || 0} {post.commentsCount === 1 ? "comment" : "comments"}
        </Button>
      </Box>
    </Paper>
  );
}

export default PostCard;
