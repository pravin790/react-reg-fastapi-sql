export const ALLOWED_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
];

export const MEDIA_ACCEPT = ".jpg,.jpeg,.png,.gif,.mp4,.webm,.ogg,.mov";

export const isVideoMedia = (media) => {
  const mediaName = typeof media === "string" ? media : media?.name || "";
  return /\.(mp4|webm|ogg|mov)$/i.test(mediaName);
};
