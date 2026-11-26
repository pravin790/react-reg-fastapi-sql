import React, { useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Typography,
} from "@mui/material";

import { API_BASE_URL } from "../../services/api";
import BlockedUsersDialog from "./BlockedUsersDialog";
import FollowListDialog from "./FollowListDialog";
import FollowRequestsDialog from "./FollowRequestsDialog";

function ProfileHeader({
  profile,
  isOwnProfile,
  followUpdating,
  blockUpdating,
  onFollowToggle,
  onBlockToggle,
  onFollowRequestResponded,
  onBrowseUsers,
  onBackHome,
  onOpenProfile,
  onEditProfile,
  onChangePassword,
}) {
  const [listType, setListType] = useState(null);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [blockedUsersOpen, setBlockedUsersOpen] = useState(false);
  const [blockConfirmationOpen, setBlockConfirmationOpen] = useState(false);
  const [actionsAnchor, setActionsAnchor] = useState(null);
  const actionsOpen = Boolean(actionsAnchor);

  const handleActionsOpen = (event) => {
    setActionsAnchor(event.currentTarget);
  };

  const handleActionsClose = () => {
    setActionsAnchor(null);
  };

  return (
    <>
      <Paper
        elevation={3}
        sx={{
          p: 2.5,
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
          Profile
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            size="small"
            onClick={onBackHome}
            sx={{
              minHeight: 34,
              py: 0.8,
              px: 1.5,
              fontSize: "0.875rem",
              lineHeight: 1.2,
              textTransform: "none",
            }}
          >
            Back to posts
          </Button>

          {isOwnProfile && (
            <>
              <IconButton
                size="small"
                onClick={handleActionsOpen}
                aria-label="profile actions"
                sx={{
                  width: 26,
                  height: 26,
                  padding: 0,
                  borderRadius: 0,
                  backgroundColor: "transparent",
                  color: "text.primary",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "transparent",
                    opacity: 0.7,
                  },
                }}
              >
                <Box
                  component="span"
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "-1px",
                    fontSize: 12,
                    lineHeight: 0.8,
                    color: "#111827",
                    transform: "translateY(-1px)",
                  }}
                >
                  <span>•</span>
                  <span>•</span>
                  <span>•</span>
                </Box>
              </IconButton>
              <Menu
                anchorEl={actionsAnchor}
                open={actionsOpen}
                onClose={handleActionsClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <MenuItem
                  onClick={() => {
                    handleActionsClose();
                    onEditProfile();
                  }}
                >
                  Edit profile
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleActionsClose();
                    onChangePassword();
                  }}
                >
                  Change password
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleActionsClose();
                    setBlockedUsersOpen(true);
                  }}
                >
                  Blocked users
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Paper>
      {profile && (
        <Paper
          elevation={3}
          sx={{
            p: 3,
            mb: 4,
            display: "flex",
            alignItems: "center",
            gap: 3,
            flexWrap: "wrap",
          }}
        >
          <Avatar
            src={
              profile.image
                ? `${API_BASE_URL}/${profile.image.replace(/\\/g, "/")}`
                : undefined
            }
            alt={`${profile.firstName} ${profile.lastName}`}
            sx={{ width: 96, height: 96 }}
          />
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="h5" fontWeight="bold">
              {profile.firstName} {profile.lastName}
            </Typography>
            <Box sx={{ display: "flex", gap: 3, mt: 2, flexWrap: "wrap" }}>
              <Typography>
                <strong>{profile.postCount ?? 0}</strong>&nbsp;posts
              </Typography>
              <Button
                variant="text"
                onClick={() => setListType("followers")}
                sx={{ color: "text.primary", textTransform: "none", p: 0 }}
              >
                <strong>{profile.followersCount}</strong>&nbsp;followers
              </Button>
              <Button
                variant="text"
                onClick={() => setListType("following")}
                sx={{ color: "text.primary", textTransform: "none", p: 0 }}
              >
                <strong>{profile.followingCount}</strong>&nbsp;following
              </Button>
            </Box>
          </Box>
          {!isOwnProfile && (
            <>
              <Button
                variant={
                  profile.isFollowing || profile.isFollowRequested
                    ? "outlined"
                    : "contained"
                }
                disabled={followUpdating || blockUpdating}
                onClick={onFollowToggle}
              >
                {profile.isFollowing
                  ? "Following"
                  : profile.isFollowRequested
                    ? "Requested"
                    : "Follow"}
              </Button>
              <Button
                variant="outlined"
                color="error"
                disabled={followUpdating || blockUpdating}
                onClick={() => setBlockConfirmationOpen(true)}
              >
                {profile.isBlockedByCurrentUser ? "Unblock" : "Block"}
              </Button>
            </>
          )}
          {isOwnProfile && (
            <Button variant="outlined" onClick={() => setRequestsOpen(true)}>
              Follow requests ({profile.pendingFollowRequestCount || 0})
            </Button>
          )}
        </Paper>
      )}
      {profile && (
        <FollowListDialog
          profileId={profile.id}
          listType={listType}
          onClose={() => setListType(null)}
          onOpenProfile={onOpenProfile}
        />
      )}
      {profile && isOwnProfile && (
        <FollowRequestsDialog
          profileId={profile.id}
          open={requestsOpen}
          onClose={() => setRequestsOpen(false)}
          onRequestResponded={onFollowRequestResponded}
        />
      )}
      {profile && isOwnProfile && (
        <BlockedUsersDialog
          open={blockedUsersOpen}
          onClose={() => setBlockedUsersOpen(false)}
          onOpenProfile={onOpenProfile}
        />
      )}
      {profile && !isOwnProfile && (
        <Dialog
          open={blockConfirmationOpen}
          onClose={() => {
            if (!blockUpdating) {
              setBlockConfirmationOpen(false);
            }
          }}
        >
          <DialogTitle>
            {profile.isBlockedByCurrentUser ? "Unblock user?" : "Block user?"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              {profile.isBlockedByCurrentUser
                ? `Are you sure you want to unblock ${profile.firstName} ${profile.lastName}?`
                : `Are you sure you want to block ${profile.firstName} ${profile.lastName}?`}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setBlockConfirmationOpen(false)}
              disabled={blockUpdating}
            >
              Cancel
            </Button>
            <Button
              color={profile.isBlockedByCurrentUser ? "primary" : "error"}
              onClick={async () => {
                await onBlockToggle();
                setBlockConfirmationOpen(false);
              }}
              disabled={blockUpdating}
              autoFocus
            >
              {profile.isBlockedByCurrentUser ? "Unblock" : "Block"}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}

export default ProfileHeader;
