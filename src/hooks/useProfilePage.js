import { useEffect, useState } from "react";

import { api } from "../services/api";
import usePostInteractions from "./usePostInteractions";

const POSTS_PER_PAGE = 10;

function useProfilePage({ userId, currentUser }) {
  const currentUserId = currentUser?.id || currentUser?._id;
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [followUpdating, setFollowUpdating] = useState(false);
  const [blockUpdating, setBlockUpdating] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [deletePost, setDeletePost] = useState(null);

  const interactions = usePostInteractions({
    posts,
    setPosts,
    currentUserId,
    onError: setError,
  });

  useEffect(() => {
    let isCurrent = true;

    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      setProfile(null);
      setPosts([]);
      setPage(1);
      try {
        const [profileData, postData] = await Promise.all([
          api.get(`/api/users/${userId}`),
          api.get(
            `/api/posts?userId=${encodeURIComponent(userId)}&page=1&limit=${POSTS_PER_PAGE}`
          ),
        ]);
        if (isCurrent) {
          setProfile({
            ...profileData.user,
            postCount: profileData.user.postCount,
          });
          setPosts(postData.posts || []);
          setHasMorePosts(1 < (postData.totalPages || 1));
        }
      } catch (fetchError) {
        if (isCurrent) {
          setError(fetchError.message || "Failed to load profile");
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    };

    fetchProfile();
    return () => {
      isCurrent = false;
    };
  }, [userId]);

  const handleFollowToggle = async () => {
    if (!profile || followUpdating) {
      return;
    }

    if (!profile.isFollowing && !profile.isFollowRequested) {
      if (profile.isBlockedByCurrentUser) {
        setError("You have to unblock this user to follow them.");
        return;
      }
      if (profile.isBlockingCurrentUser) {
        setError("This user has blocked you, so you cannot follow them.");
        return;
      }
    }

    setFollowUpdating(true);
    setError("");
    try {
      const endpoint = `/api/users/${profile.id}/follow`;
      const data =
        profile.isFollowing || profile.isFollowRequested
          ? await api.delete(endpoint)
          : await api.post(endpoint, {});

      setProfile((previousProfile) => ({
        ...previousProfile,
        isFollowing: data.isFollowing,
        isFollowRequested: data.isFollowRequested,
        followersCount: data.followersCount,
      }));
    } catch (followError) {
      setError(followError.message || "Failed to update follow status");
    } finally {
      setFollowUpdating(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!profile || blockUpdating) {
      return;
    }

    setBlockUpdating(true);
    setError("");
    try {
      const endpoint = `/api/users/${profile.id}/block`;
      const data = profile.isBlockedByCurrentUser
        ? await api.delete(endpoint)
        : await api.post(endpoint, {});

      setProfile((previousProfile) => ({
        ...previousProfile,
        isBlockedByCurrentUser: data.isBlocked,
      }));
    } catch (blockError) {
      setError(blockError.message || "Failed to update block status");
    } finally {
      setBlockUpdating(false);
    }
  };

  const handleFollowRequestResponded = ({ accepted, followersCount }) => {
    setProfile((previousProfile) =>
      previousProfile
        ? {
            ...previousProfile,
            pendingFollowRequestCount: Math.max(
              (previousProfile.pendingFollowRequestCount || 0) - 1,
              0
            ),
            ...(accepted ? { followersCount } : {}),
          }
        : previousProfile
    );
  };

  const refreshPosts = async () => {
    try {
      const firstPage = await api.get(
        `/api/posts?userId=${encodeURIComponent(userId)}&page=1&limit=${POSTS_PER_PAGE}`
      );
      const totalPages = firstPage.totalPages || 0;
      const pagesToLoad = Math.min(page, totalPages);
      const remainingPages = await Promise.all(
        Array.from({ length: Math.max(pagesToLoad - 1, 0) }, (_, index) =>
          api.get(
            `/api/posts?userId=${encodeURIComponent(userId)}&page=${index + 2}&limit=${POSTS_PER_PAGE}`
          )
        )
      );

      setPosts([
        ...(firstPage.posts || []),
        ...remainingPages.flatMap((pageData) => pageData.posts || []),
      ]);
      setProfile((previousProfile) =>
        previousProfile
          ? { ...previousProfile, postCount: firstPage.totalPosts }
          : previousProfile
      );
      setPage(pagesToLoad);
      setHasMorePosts(pagesToLoad < totalPages);
    } catch (refreshError) {
      setError(refreshError.message || "Failed to refresh profile posts");
    }
  };

  const loadMorePosts = async () => {
    if (loadingMore || !hasMorePosts) {
      return;
    }

    const nextPage = page + 1;
    setLoadingMore(true);
    setError("");
    try {
      const data = await api.get(
        `/api/posts?userId=${encodeURIComponent(userId)}&page=${nextPage}&limit=${POSTS_PER_PAGE}`
      );
      setPosts((previousPosts) => [...previousPosts, ...(data.posts || [])]);
      setPage(nextPage);
      setHasMorePosts(nextPage < (data.totalPages || 1));
    } catch (fetchError) {
      setError(fetchError.message || "Failed to load more posts");
    } finally {
      setLoadingMore(false);
    }
  };

  const isOwnProfile =
    currentUserId && profile?.id?.toString() === currentUserId.toString();

  return {
    currentUserId,
    profile,
    posts,
    loading,
    loadingMore,
    hasMorePosts,
    error,
    setError,
    followUpdating,
    blockUpdating,
    editingPost,
    setEditingPost,
    deletePost,
    setDeletePost,
    interactions,
    isOwnProfile,
    handleFollowToggle,
    handleBlockToggle,
    handleFollowRequestResponded,
    refreshPosts,
    loadMorePosts,
  };
}

export default useProfilePage;
