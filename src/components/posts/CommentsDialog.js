import React, { useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";

function CommentsDialog({
  commentsPost,
  onClose,
  comments,
  commentsLoading,
  commentInputs,
  setCommentInputs,
  commentSubmitting,
  hasMoreComments,
  currentUserId,
  handleCommentSubmit,
  handleCommentDelete,
  loadMoreComments,
}) {
  const commentsObserverRef = useRef(null);

  const postId = commentsPost?._id;
  const hasMore = postId ? hasMoreComments[postId] : false;
  const isLoading = postId ? commentsLoading[postId] : false;

  useEffect(() => {
    const target = commentsObserverRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && postId) {
          if (loadMoreComments) {
            loadMoreComments(postId);
          }
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasMore, isLoading, postId, loadMoreComments]);

  return (
    <Dialog
      open={Boolean(commentsPost)}
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>Comments on {commentsPost?.title}</DialogTitle>
      <DialogContent dividers>
        {commentsPost && commentsLoading[commentsPost._id] && (!comments[commentsPost._id] || comments[commentsPost._id].length === 0) && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress size={26} />
          </Box>
        )}

        {commentsPost && (!commentsLoading[commentsPost._id] || (comments[commentsPost._id] && comments[commentsPost._id].length > 0)) && (
          <>
            {(comments[commentsPost._id] || []).length === 0 ? (
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                No comments yet.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {comments[commentsPost._id].map((comment) => {
                  const commentUserId = comment.user?.id || comment.user?._id;
                  const isCommentOwner =
                    commentUserId &&
                    currentUserId &&
                    commentUserId.toString() === currentUserId.toString();
                  const replyInput = commentInputs[comment._id] || "";

                  return (
                    <Box key={comment._id}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          backgroundColor: "action.hover",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 2,
                          }}
                        >
                          <Typography variant="subtitle2">
                            {comment.user
                              ? `${comment.user.firstName} ${comment.user.lastName}`
                              : "Unknown user"}
                          </Typography>
                          {isCommentOwner && (
                            <Button
                              size="small"
                              color="error"
                              onClick={() =>
                                handleCommentDelete(commentsPost._id, comment._id)
                              }
                            >
                              Delete
                            </Button>
                          )}
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{ whiteSpace: "pre-wrap" }}
                        >
                          {comment.text}
                        </Typography>
                        <Box
                          component="form"
                          onSubmit={(event) =>
                            handleCommentSubmit(
                              event,
                              commentsPost._id,
                              comment._id
                            )
                          }
                          sx={{ display: "flex", gap: 1, mt: 1 }}
                        >
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Reply to this comment"
                            value={replyInput}
                            onChange={(event) =>
                              setCommentInputs((previous) => ({
                                ...previous,
                                [comment._id]: event.target.value,
                              }))
                            }
                            slotProps={{ htmlInput: { maxLength: 500 } }}
                          />
                          <Button
                            type="submit"
                            size="small"
                            variant="outlined"
                            disabled={commentSubmitting[commentsPost._id]}
                          >
                            Reply
                          </Button>
                        </Box>
                      </Box>

                      {(comment.replies || []).map((reply) => {
                        const replyUserId = reply.user?.id || reply.user?._id;
                        const isReplyOwner =
                          replyUserId &&
                          currentUserId &&
                          replyUserId.toString() === currentUserId.toString();

                        return (
                          <Box
                            key={reply._id}
                            sx={{
                              ml: 4,
                              mt: 1,
                              p: 1.5,
                              borderLeft: "3px solid",
                              borderColor: "divider",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 2,
                              }}
                            >
                              <Typography variant="subtitle2">
                                {reply.user
                                  ? `${reply.user.firstName} ${reply.user.lastName}`
                                  : "Unknown user"}
                              </Typography>
                              {isReplyOwner && (
                                <Button
                                  size="small"
                                  color="error"
                                  onClick={() =>
                                    handleCommentDelete(
                                      commentsPost._id,
                                      reply._id
                                    )
                                  }
                                >
                                  Delete
                                </Button>
                              )}
                            </Box>
                            <Typography
                              variant="body2"
                              sx={{ whiteSpace: "pre-wrap" }}
                            >
                              {reply.text}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  );
                })}

                {/* Infinite scroll sentinel for comments */}
                <div
                  ref={commentsObserverRef}
                  style={{ height: "10px", width: "100%" }}
                />

                {commentsLoading[commentsPost._id] &&
                  (comments[commentsPost._id] || []).length > 0 && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        py: 1.5,
                      }}
                    >
                      <CircularProgress size={20} />
                    </Box>
                  )}
              </Box>
            )}

            <Box
              component="form"
              onSubmit={(event) => handleCommentSubmit(event, commentsPost._id)}
              sx={{ display: "flex", gap: 1, mt: 3, alignItems: "flex-start" }}
            >
              <TextField
                fullWidth
                size="small"
                multiline
                maxRows={4}
                label="Add a comment"
                value={commentInputs[commentsPost._id] || ""}
                onChange={(event) =>
                  setCommentInputs((previous) => ({
                    ...previous,
                    [commentsPost._id]: event.target.value,
                  }))
                }
                slotProps={{ htmlInput: { maxLength: 500 } }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={commentSubmitting[commentsPost._id]}
              >
                {commentSubmitting[commentsPost._id] ? "Posting..." : "Post"}
              </Button>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default CommentsDialog;
