import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

import { api, API_BASE_URL } from "../../services/api";
import {
  ALLOWED_MEDIA_TYPES,
  MEDIA_ACCEPT,
  isVideoMedia,
} from "../../utils/mediaUtils";

function EditPostDialog({
  post,
  onClose,
  currentUserId,
  onPostUpdated,
  onError,
}) {
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImages, setEditImages] = useState([]);
  const [editExistingImages, setEditExistingImages] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (post) {
      setEditTitle(post.title || "");
      setEditDescription(post.description || "");
      setEditImages([]);
      setEditExistingImages(post.images || []);
    }
  }, [post]);

  const handleEditImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    if (selectedFiles.length + editExistingImages.length > 10) {
      if (onError) onError("You can upload a maximum of 10 media files.");
      setEditImages([]);
      return;
    }

    if (
      selectedFiles.some(
        (selectedFile) => !ALLOWED_MEDIA_TYPES.includes(selectedFile.type)
      )
    ) {
      if (onError)
        onError(
          "Only JPG, PNG, GIF, MP4, WebM, OGG, and MOV files are allowed."
        );
      setEditImages([]);
      return;
    }

    if (onError) onError("");
    setEditImages((previousImages) => [...previousImages, ...selectedFiles]);
    event.target.value = "";
  };

  const removeEditImage = (imageIndex) => {
    setEditImages((previousImages) =>
      previousImages.filter((_, index) => index !== imageIndex)
    );
  };

  const removeExistingEditImage = (imageIndex) => {
    setEditExistingImages((previousImages) =>
      previousImages.filter((_, index) => index !== imageIndex)
    );
  };

  const handleEditPost = async () => {
    try {
      setActionLoading(true);
      const formData = new FormData();
      formData.append("title", editTitle);
      formData.append("description", editDescription);
      formData.append("userId", currentUserId);
      formData.append("existingImages", JSON.stringify(editExistingImages));
      editImages.forEach((selectedImage) => {
        formData.append("images", selectedImage);
      });

      await api.putForm(`/api/posts/${post._id}`, formData);

      onClose();
      if (onPostUpdated) {
        await onPostUpdated();
      }
    } catch (actionError) {
      if (onError) {
        onError(actionError.message || "Failed to update post");
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (!post) {
    return null;
  }

  return (
    <Dialog
      open={Boolean(post)}
      onClose={() => !actionLoading && onClose()}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Edit Post</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Title"
          value={editTitle}
          onChange={(event) => setEditTitle(event.target.value)}
          sx={{ mt: 1, mb: 3 }}
        />
        <ReactQuill
          theme="snow"
          value={editDescription}
          onChange={setEditDescription}
          modules={{
            toolbar: [
              ["bold", "italic", "underline"],
              [{ list: "bullet" }],
              ["link"],
            ],
          }}
        />
        <Button variant="outlined" component="label" sx={{ mt: 3 }}>
          Add Images or Videos
          <input
            type="file"
            hidden
            multiple
            accept={`${MEDIA_ACCEPT},${ALLOWED_MEDIA_TYPES.join(",")}`}
            onChange={handleEditImageChange}
          />
        </Button>
        {(editExistingImages.length > 0 || editImages.length > 0) && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
            {editExistingImages.map((imagePath, imageIndex) => (
              <Box
                key={`existing-${imagePath}-${imageIndex}`}
                sx={{ position: "relative" }}
              >
                {isVideoMedia(imagePath) ? (
                  <Box
                    component="video"
                    src={`${API_BASE_URL}/${imagePath.replace(/\\/g, "/")}`}
                    controls
                    controlsList="nodownload noplaybackrate"
                    disablePictureInPicture
                    sx={{
                      width: 120,
                      height: 90,
                      objectFit: "cover",
                      borderRadius: 1,
                    }}
                  />
                ) : (
                  <Box
                    component="img"
                    src={`${API_BASE_URL}/${imagePath.replace(/\\/g, "/")}`}
                    alt={`Current image ${imageIndex + 1}`}
                    sx={{
                      width: 120,
                      height: 90,
                      objectFit: "cover",
                      borderRadius: 1,
                    }}
                  />
                )}
                <Button
                  type="button"
                  size="small"
                  color="error"
                  onClick={() => removeExistingEditImage(imageIndex)}
                  sx={{ display: "block", minWidth: 0, mx: "auto" }}
                >
                  Remove
                </Button>
              </Box>
            ))}
            {editImages.map((selectedImage, imageIndex) => (
              <Box
                key={`${selectedImage.name}-${imageIndex}`}
                sx={{ position: "relative" }}
              >
                {isVideoMedia(selectedImage) ? (
                  <Box
                    component="video"
                    src={URL.createObjectURL(selectedImage)}
                    controls
                    controlsList="nodownload noplaybackrate"
                    disablePictureInPicture
                    sx={{
                      width: 120,
                      height: 90,
                      objectFit: "cover",
                      borderRadius: 1,
                    }}
                  />
                ) : (
                  <Box
                    component="img"
                    src={URL.createObjectURL(selectedImage)}
                    alt={selectedImage.name}
                    sx={{
                      width: 120,
                      height: 90,
                      objectFit: "cover",
                      borderRadius: 1,
                    }}
                  />
                )}
                <Button
                  type="button"
                  size="small"
                  color="error"
                  onClick={() => removeEditImage(imageIndex)}
                  sx={{ display: "block", minWidth: 0, mx: "auto" }}
                >
                  Remove
                </Button>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={actionLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleEditPost}
          variant="contained"
          disabled={actionLoading}
        >
          {actionLoading ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditPostDialog;

