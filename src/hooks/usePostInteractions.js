import { useState } from "react";

import { api } from "../services/api";

const COMMENTS_PER_PAGE = 5;
const LIKES_PER_PAGE = 3;

function usePostInteractions({ posts, setPosts, currentUserId, onError }) {
  const [likeUpdating, setLikeUpdating] = useState({});
  const [comments, setComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [commentsPost, setCommentsPost] = useState(null);
  const [commentsLoading, setCommentsLoading] = useState({});
  const [commentSubmitting, setCommentSubmitting] = useState({});
  const [commentPages, setCommentPages] = useState({});
  const [hasMoreComments, setHasMoreComments] = useState({});
  const [likesPost, setLikesPost] = useState(null);
  const [likedUsers, setLikedUsers] = useState([]);
  const [likesLoading, setLikesLoading] = useState(false);
  const [likesError, setLikesError] = useState("");
  const [likesPage, setLikesPage] = useState(1);
  const [hasMoreLikes, setHasMoreLikes] = useState(false);

  const reportError = (message) => {
    if (onError) {
      onError(message);
    }
  };

  const handleLikeToggle = async (post) => {
    if (!currentUserId || likeUpdating[post._id]) {
      return;
    }

    try {
      setLikeUpdating((previous) => ({ ...previous, [post._id]: true }));
      const data = await api.post(`/api/posts/${post._id}/like`, {
        userId: currentUserId,
      });
      setPosts((previousPosts) =>
        previousPosts.map((currentPost) =>
          currentPost._id === post._id
            ? {
                ...currentPost,
                likesCount: data.likesCount,
                likedByCurrentUser: data.liked,
              }
            : currentPost
        )
      );
    } catch (likeError) {
      reportError(likeError.message || "Failed to update like");
    } finally {
      setLikeUpdating((previous) => ({ ...previous, [post._id]: false }));
    }
  };

  const loadComments = async (postId, page = 1) => {
    try {
      setCommentsLoading((previous) => ({ ...previous, [postId]: true }));
      const data = await api.get(
        `/api/posts/${postId}/comments?page=${page}&limit=${COMMENTS_PER_PAGE}`
      );
      setComments((previous) => ({
        ...previous,
        [postId]:
          page === 1
            ? data.comments || []
            : [
                ...(previous[postId] || []),
                ...(data.comments || []).filter(
                  (comment) =>
                    !(previous[postId] || []).some(
                      (existingComment) => existingComment._id === comment._id
                    )
                ),
              ],
      }));
      setCommentPages((previous) => ({ ...previous, [postId]: page }));
      setHasMoreComments((previous) => ({
        ...previous,
        [postId]: Boolean(data.hasMore),
      }));
    } catch (commentError) {
      reportError(commentError.message || "Failed to load comments");
    } finally {
      setCommentsLoading((previous) => ({ ...previous, [postId]: false }));
    }
  };

  const toggleComments = async (postId) => {
    const post = posts.find((currentPost) => currentPost._id === postId);
    setCommentsPost(post || null);
    if (!comments[postId]) {
      await loadComments(postId);
    }
  };

  const loadMoreComments = async (postId) => {
    if (commentsLoading[postId] || !hasMoreComments[postId]) {
      return;
    }
    await loadComments(postId, (commentPages[postId] || 1) + 1);
  };

  const handleCommentSubmit = async (event, postId, parentComment = null) => {
    event.preventDefault();
    const inputKey = parentComment || postId;
    const text = (commentInputs[inputKey] || "").trim();

    if (!text || text.length > 500) {
      reportError("Comment must contain between 1 and 500 characters.");
      return;
    }

    try {
      setCommentSubmitting((previous) => ({ ...previous, [postId]: true }));
      reportError("");
      const data = await api.post(`/api/posts/${postId}/comments`, {
        text,
        userId: currentUserId,
        parentComment,
      });
      setComments((previous) => ({
        ...previous,
        [postId]: parentComment
          ? (previous[postId] || []).map((comment) =>
              comment._id === parentComment
                ? {
                    ...comment,
                    replies: [...(comment.replies || []), data.comment],
                  }
                : comment
            )
          : [...(previous[postId] || []), data.comment],
      }));
      setPosts((previousPosts) =>
        previousPosts.map((post) =>
          post._id === postId
            ? { ...post, commentsCount: data.commentsCount }
            : post
        )
      );
      setCommentInputs((previous) => ({ ...previous, [inputKey]: "" }));
    } catch (commentError) {
      reportError(commentError.message || "Failed to add comment");
    } finally {
      setCommentSubmitting((previous) => ({ ...previous, [postId]: false }));
    }
  };

  const handleCommentDelete = async (postId, commentId) => {
    try {
      const data = await api.delete(
        `/api/posts/${postId}/comments/${commentId}`,
        { userId: currentUserId }
      );
      setComments((previous) => ({
        ...previous,
        [postId]: (previous[postId] || [])
          .filter((comment) => comment._id !== commentId)
          .map((comment) => ({
            ...comment,
            replies: (comment.replies || []).filter(
              (reply) => reply._id !== commentId
            ),
          })),
      }));
      setPosts((previousPosts) =>
        previousPosts.map((post) =>
          post._id === postId
            ? { ...post, commentsCount: data.commentsCount }
            : post
        )
      );
    } catch (commentError) {
      reportError(commentError.message || "Failed to delete comment");
    }
  };

  const loadLikes = async (postId, page = 1) => {
    setLikesLoading(true);
    try {
      const data = await api.get(
        `/api/posts/${postId}/likes?page=${page}&limit=${LIKES_PER_PAGE}`
      );
      const users = data.users || [];
      const hasPaginationMetadata =
        data.hasMore !== undefined || data.currentPage !== undefined;
      const pageStart = (page - 1) * LIKES_PER_PAGE;
      const pageUsers = hasPaginationMetadata
        ? users.slice(0, LIKES_PER_PAGE)
        : users.slice(pageStart, pageStart + LIKES_PER_PAGE);

      setLikedUsers((previousUsers) => {
        if (page === 1) {
          return pageUsers;
        }
        const existingUserIds = new Set(
          previousUsers.map((likedUser) => likedUser._id)
        );
        const newUsers = pageUsers.filter(
          (likedUser) => !existingUserIds.has(likedUser._id)
        );
        if (newUsers.length === 0) {
          setHasMoreLikes(false);
        }
        return [...previousUsers, ...newUsers];
      });
      setLikesPage(page);
      setHasMoreLikes(
        data.hasMore !== undefined
          ? Boolean(data.hasMore)
          : page === 1 && users.length > LIKES_PER_PAGE
      );
    } catch (likesFetchError) {
      setLikesError(likesFetchError.message || "Failed to load post likes");
    } finally {
      setLikesLoading(false);
    }
  };

  const openLikes = async (post) => {
    setLikesPost(post);
    setLikedUsers([]);
    setLikesError("");
    setLikesPage(1);
    setHasMoreLikes(false);
    await loadLikes(post._id, 1);
  };

  return {
    likeUpdating,
    comments,
    commentInputs,
    setCommentInputs,
    commentsPost,
    setCommentsPost,
    commentsLoading,
    commentSubmitting,
    hasMoreComments,
    likesPost,
    setLikesPost,
    likedUsers,
    likesLoading,
    likesError,
    hasMoreLikes,
    handleLikeToggle,
    toggleComments,
    loadMoreComments,
    handleCommentSubmit,
    handleCommentDelete,
    openLikes,
    loadLikes,
    likesPage,
  };
}

export default usePostInteractions;
