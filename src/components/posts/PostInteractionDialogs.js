import React from "react";

import CommentsDialog from "./CommentsDialog";
import LikesDialog from "./LikesDialog";

function PostInteractionDialogs({ interactions, currentUserId }) {
  return (
    <>
      <CommentsDialog
        commentsPost={interactions.commentsPost}
        onClose={() => interactions.setCommentsPost(null)}
        comments={interactions.comments}
        commentsLoading={interactions.commentsLoading}
        commentInputs={interactions.commentInputs}
        setCommentInputs={interactions.setCommentInputs}
        commentSubmitting={interactions.commentSubmitting}
        hasMoreComments={interactions.hasMoreComments}
        currentUserId={currentUserId}
        handleCommentSubmit={interactions.handleCommentSubmit}
        handleCommentDelete={interactions.handleCommentDelete}
        loadMoreComments={interactions.loadMoreComments}
      />
      <LikesDialog
        likesPost={interactions.likesPost}
        onClose={() => interactions.setLikesPost(null)}
        likedUsers={interactions.likedUsers}
        likesLoading={interactions.likesLoading}
        likesError={interactions.likesError}
        hasMoreLikes={interactions.hasMoreLikes}
        onLoadMoreLikes={() =>
          interactions.loadLikes(
            interactions.likesPost._id,
            interactions.likesPage + 1
          )
        }
      />
    </>
  );
}

export default PostInteractionDialogs;
