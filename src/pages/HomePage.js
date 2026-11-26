import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";

import CreatePostForm from "../components/posts/CreatePostForm";
import EditPostDialog from "../components/posts/EditPostDialog";
import DeletePostDialog from "../components/posts/DeletePostDialog";
import PostCard from "../components/posts/PostCard";
import PostInteractionDialogs from "../components/posts/PostInteractionDialogs";
import { api } from "../services/api";
import { clearStoredUser } from "../utils/authUtils";
import usePostInteractions from "../hooks/usePostInteractions";

const POSTS_PER_PAGE = 5;

function Home({ user, setUser, onBrowseUsers, onOpenProfile, onEditProfile, onChangePassword }) {
  const [showAddPost, setShowAddPost] = useState(false);

  const [posts, setPosts] = useState([]);
  const [postPage, setPostPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState("");

  const [editingPost, setEditingPost] = useState(null);
  const [deletePost, setDeletePost] = useState(null);

  const isFetchingPosts = useRef(false);
  const observerTarget = useRef(null);

  const currentUserId = user?.id || user?._id;
  const interactions = usePostInteractions({
    posts,
    setPosts,
    currentUserId,
    onError: setPostsError,
  });

  const logout = () => {
    clearStoredUser();
    setUser(null);
  };

  const fetchPosts = useCallback(async (page = 1) => {
    if (isFetchingPosts.current) {
      return;
    }

    try {
      isFetchingPosts.current = true;
      setPostsLoading(true);
      setPostsError("");

      const endpoint = `/api/posts?page=${page}&limit=${POSTS_PER_PAGE}`;

      const data = await api.get(endpoint);
      const receivedPosts = data.posts || [];

      if (page === 1) {
        setPosts(receivedPosts);
      } else {
        setPosts((previousPosts) => {
          const existingPostIds = new Set(
            previousPosts.map((post) => post._id)
          );

          const newPosts = receivedPosts.filter(
            (post) => !existingPostIds.has(post._id)
          );

          return [...previousPosts, ...newPosts];
        });
      }

      setPostPage(page);
      setHasMorePosts(page < (data.totalPages || 1));
    } catch (fetchError) {
      console.error("Fetch posts error:", fetchError);
      setPostsError(fetchError.message || "Failed to load posts");
    } finally {
      isFetchingPosts.current = false;
      setPostsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  const handleLoadMorePosts = useCallback(() => {
    if (
      !postsLoading &&
      hasMorePosts &&
      !isFetchingPosts.current
    ) {
      fetchPosts(postPage + 1);
    }
  }, [postsLoading, hasMorePosts, postPage, fetchPosts]);

  // Infinite Scroll Observer for Posts
  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [handleLoadMorePosts]);

  return (
    <Box
      sx={{
        maxWidth: 900,
        mx: "auto",
        p: 3,
      }}
    >
      {/* Header */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography variant="h4">Welcome</Typography>
          <Typography variant="h6">
            {user?.firstName} {user?.lastName}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Button variant="outlined" onClick={onBrowseUsers}>
            Find Users
          </Button>
          <Button
            variant="outlined"
            onClick={() => onOpenProfile(currentUserId)}
          >
            My Profile
          </Button>
          <Button
            variant="contained"
            onClick={() => setShowAddPost((previousValue) => !previousValue)}
          >
            {showAddPost ? "Close Add Post" : "Add Post"}
          </Button>

          <Button variant="outlined" color="error" onClick={logout}>
            Logout
          </Button>
        </Box>
      </Paper>

      {/* Add Post Form */}
      {showAddPost && (
        <CreatePostForm
          user={user}
          onPostCreated={async () => {
            setPosts([]);
            setPostPage(1);
            setHasMorePosts(true);
            isFetchingPosts.current = false;
            await fetchPosts(1);
          }}
          onClose={() => setShowAddPost(false)}
        />
      )}

      {/* Posts Feed */}
      <Typography variant="h4" sx={{ mb: 3 }}>
        Posts
      </Typography>

      {postsError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {postsError}
        </Alert>
      )}

      {posts.length === 0 && !postsLoading && !postsError && (
        <Typography color="text.secondary">No posts available.</Typography>
      )}

      {posts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          currentUserId={currentUserId}
          onEdit={(targetPost) => setEditingPost(targetPost)}
          onDelete={(targetPost) => setDeletePost(targetPost)}
          onLikeToggle={interactions.handleLikeToggle}
          isLikeUpdating={interactions.likeUpdating[post._id]}
          onOpenLikes={interactions.openLikes}
          onOpenComments={interactions.toggleComments}
          isCommentsLoading={interactions.commentsLoading[post._id]}
        />
      ))}

      {/* Edit Post Dialog */}
      <EditPostDialog
        post={editingPost}
        onClose={() => setEditingPost(null)}
        currentUserId={currentUserId}
        onPostUpdated={async () => {
          await fetchPosts(1);
        }}
        onError={(err) => setPostsError(err)}
      />

      {/* Delete Post Dialog */}
      <DeletePostDialog
        post={deletePost}
        onClose={() => setDeletePost(null)}
        currentUserId={currentUserId}
        onPostDeleted={async () => {
          setPosts([]);
          setPostPage(1);
          setHasMorePosts(true);
          await fetchPosts(1);
        }}
        onError={(err) => setPostsError(err)}
      />

      <PostInteractionDialogs
        interactions={interactions}
        currentUserId={currentUserId}
      />

      {/* Infinite Scroll Sentinel and Status */}
      <Box
        sx={{
          minHeight: 50,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: 2,
          my: 4,
        }}
      >
        {/* Invisible target that triggers loading when scrolled into view */}
        <div ref={observerTarget} style={{ height: "20px", width: "100%" }} />

        {postsLoading && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 2 }}>
            <CircularProgress size={24} />
            <Typography>Loading more posts...</Typography>
          </Box>
        )}

        {!postsLoading && !hasMorePosts && posts.length > 0 && (
          <Typography color="text.secondary">
            No more posts to load.
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default Home;