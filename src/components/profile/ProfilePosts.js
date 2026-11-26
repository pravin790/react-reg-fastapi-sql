import React from "react";
import { Box, Button, Typography } from "@mui/material";

import PostCard from "../posts/PostCard";

function ProfilePosts({
  posts,
  currentUserId,
  interactions,
  onEdit,
  onDelete,
  hasMorePosts,
  loadingMore,
  onLoadMore,
}) {
  return (
    <>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Posts
      </Typography>
      {posts.length === 0 && (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          No posts yet.
        </Typography>
      )}
      {posts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          currentUserId={currentUserId}
          onEdit={onEdit}
          onDelete={onDelete}
          onLikeToggle={interactions.handleLikeToggle}
          isLikeUpdating={interactions.likeUpdating[post._id]}
          onOpenLikes={interactions.openLikes}
          onOpenComments={interactions.toggleComments}
          isCommentsLoading={interactions.commentsLoading[post._id]}
        />
      ))}
      {hasMorePosts && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
          <Button
            variant="outlined"
            onClick={onLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading..." : "Load more posts"}
          </Button>
        </Box>
      )}
    </>
  );
}

export default ProfilePosts;
