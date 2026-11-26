import React from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Typography,
} from "@mui/material";

import DeletePostDialog from "../components/posts/DeletePostDialog";
import EditPostDialog from "../components/posts/EditPostDialog";
import PostInteractionDialogs from "../components/posts/PostInteractionDialogs";
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfilePosts from "../components/profile/ProfilePosts";
import useProfilePage from "../hooks/useProfilePage";

function ProfilePage({
  userId,
  currentUser,
  onOpenProfile,
  onBackHome,
  onEditProfile,
  onChangePassword,
}) {
  const profilePage = useProfilePage({ userId, currentUser });

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: 3 }}>
      <ProfileHeader
        profile={profilePage.profile}
        isOwnProfile={profilePage.isOwnProfile}
        followUpdating={profilePage.followUpdating}
        blockUpdating={profilePage.blockUpdating}
        onFollowToggle={profilePage.handleFollowToggle}
        onBlockToggle={profilePage.handleBlockToggle}
        onFollowRequestResponded={profilePage.handleFollowRequestResponded}
        onBackHome={onBackHome}
        onOpenProfile={onOpenProfile}
        onEditProfile={onEditProfile}
        onChangePassword={onChangePassword}
      />

      {profilePage.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {profilePage.error}
        </Alert>
      )}

      {profilePage.loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
          <CircularProgress />
        </Box>
      )}

      {!profilePage.loading && profilePage.profile && (
        <ProfilePosts
          posts={profilePage.posts}
          currentUserId={profilePage.currentUserId}
          interactions={profilePage.interactions}
          onEdit={profilePage.setEditingPost}
          onDelete={profilePage.setDeletePost}
          hasMorePosts={profilePage.hasMorePosts}
          loadingMore={profilePage.loadingMore}
          onLoadMore={profilePage.loadMorePosts}
        />
      )}

      <EditPostDialog
        post={profilePage.editingPost}
        onClose={() => profilePage.setEditingPost(null)}
        currentUserId={profilePage.currentUserId}
        onPostUpdated={profilePage.refreshPosts}
        onError={profilePage.setError}
      />

      <DeletePostDialog
        post={profilePage.deletePost}
        onClose={() => profilePage.setDeletePost(null)}
        currentUserId={profilePage.currentUserId}
        onPostDeleted={profilePage.refreshPosts}
        onError={profilePage.setError}
      />

      <PostInteractionDialogs
        interactions={profilePage.interactions}
        currentUserId={profilePage.currentUserId}
      />

      {!profilePage.loading && !profilePage.profile && !profilePage.error && (
        <Typography color="text.secondary">Profile not found.</Typography>
      )}
    </Box>
  );
}

export default ProfilePage;
