import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Alert,
} from "@mui/material";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

import { api } from "../../services/api";
import {
  ALLOWED_MEDIA_TYPES,
  MEDIA_ACCEPT,
  isVideoMedia,
} from "../../utils/mediaUtils";

function CreatePostForm({ user, onPostCreated, onClose }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [creatingPost, setCreatingPost] = useState(false);

  const getPlainDescription = (html) => {
    const temporaryElement = document.createElement("div");
    temporaryElement.innerHTML = html;

    return (temporaryElement.textContent || temporaryElement.innerText || "")
      .replace(/\u00a0/g, " ")
      .trim();
  };

  const handleImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files);

    if (selectedFiles.length === 0) {
      return;
    }

    if (selectedFiles.length + images.length > 10) {
      setError("You can upload a maximum of 10 media files.");
      return;
    }

    if (selectedFiles.some((selectedFile) => !ALLOWED_MEDIA_TYPES.includes(selectedFile.type))) {
      setError("Only JPG, PNG, GIF, MP4, WebM, OGG, and MOV files are allowed.");
      setImages([]);
      return;
    }

    setError("");
    setImages((previousImages) => [...previousImages, ...selectedFiles]);
    event.target.value = "";
  };

  const removeSelectedImage = (imageIndex) => {
    setImages((previousImages) =>
      previousImages.filter((_, index) => index !== imageIndex)
    );
  };

  const handleAddPost = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const trimmedTitle = title.trim();
    const plainDescription = getPlainDescription(description);

    if (trimmedTitle.length < 3 || trimmedTitle.length > 100) {
      setError("Title must contain between 3 and 100 characters.");
      return;
    }

    if (
      plainDescription.length < 2 ||
      plainDescription.length > 1000
    ) {
      setError(
        "Description must contain between 2 and 1000 characters."
      );
      return;
    }

    if (images.length === 0) {
      setError("Please select at least one image or video.");
      return;
    }

    const userId = user?.id || user?._id;

    if (!userId) {
      setError("Please log in again before creating a post.");
      return;
    }

    const formData = new FormData();

    formData.append("title", trimmedTitle);
    formData.append("description", description);
    images.forEach((selectedImage) => {
      formData.append("images", selectedImage);
    });
    formData.append("userId", userId);

    try {
      setCreatingPost(true);

      await api.postForm("/api/posts", formData);

      setSuccess("Post created successfully.");

      setTitle("");
      setDescription("");
      setImages([]);

      const imageInput = document.getElementById("post-image-input");

      if (imageInput) {
        imageInput.value = "";
      }

      if (onPostCreated) {
        await onPostCreated();
      }

      setTimeout(() => {
        if (onClose) {
          onClose();
        }
        setSuccess("");
      }, 1500);
    } catch (postError) {
      console.error("Create post error:", postError);
      setError(postError.message || "Failed to create post. Make sure the backend is running.");
    } finally {
      setCreatingPost(false);
    }
  };

  return (
    <Paper
      component="form"
      onSubmit={handleAddPost}
      elevation={3}
      sx={{
        p: 3,
        mb: 4,
      }}
    >
      <Typography variant="h5" sx={{ mb: 3 }}>
        Add New Post
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        inputprops={{
          minLength: 3,
          maxLength: 100,
        }}
        helperText={`${title.length}/100 characters`}
        sx={{ mb: 3 }}
        required
      />

      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Description
      </Typography>

      <ReactQuill
        theme="snow"
        value={description}
        onChange={setDescription}
        placeholder="Write your post description..."
        modules={{
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ align: [] }],
            ["link"],
            ["clean"],
          ],
        }}
        formats={[
          "header",
          "bold",
          "italic",
          "underline",
          "strike",
          "list",
          "align",
          "link",
        ]}
      />

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          mt: 1,
          mb: 3,
        }}
      >
        Description should contain between 2 and 1000 characters.
      </Typography>

      <Button
        variant="outlined"
        component="label"
        sx={{ mb: 2 }}
      >
        Select Images or Videos

        <input
          id="post-image-input"
          type="file"
          hidden
          multiple
          accept={`${MEDIA_ACCEPT},${ALLOWED_MEDIA_TYPES.join(",")}`}
          onChange={handleImageChange}
        />
      </Button>

      {images.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
          {images.map((selectedImage, imageIndex) => (
            <Box key={`${selectedImage.name}-${imageIndex}`} sx={{ position: "relative" }}>
              {isVideoMedia(selectedImage) ? (
                <Box
                  component="video"
                  src={URL.createObjectURL(selectedImage)}
                  controls
                  controlsList="nodownload noplaybackrate"
                  disablePictureInPicture
                  sx={{ width: 120, height: 90, objectFit: "cover", borderRadius: 1 }}
                />
              ) : (
                <Box
                  component="img"
                  src={URL.createObjectURL(selectedImage)}
                  alt={selectedImage.name}
                  sx={{ width: 120, height: 90, objectFit: "cover", borderRadius: 1 }}
                />
              )}
              <Button
                type="button"
                size="small"
                color="error"
                onClick={() => removeSelectedImage(imageIndex)}
                sx={{ display: "block", minWidth: 0, mx: "auto" }}
              >
                Remove
              </Button>
            </Box>
          ))}
        </Box>
      )}

      <Box>
        <Button
          type="submit"
          variant="contained"
          disabled={creatingPost}
        >
          {creatingPost ? "Creating..." : "Create Post"}
        </Button>
      </Box>
    </Paper>
  );
}

export default CreatePostForm;
