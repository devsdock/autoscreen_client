import { NodeURL } from "../services/api";

/**
 * Construct full image URL from relative path
 * @param {string} imagePath - Relative path like "/uploads/profiles/image.jpg" or full URL
 * @returns {string} Full image URL
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;

  // If it's already a full URL (starts with http), return as is
  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  // If it's a blob URL, return as is
  if (imagePath.startsWith("blob:")) {
    return imagePath;
  }

  // Otherwise, prepend the NodeURL
  return `${NodeURL}${imagePath}`;
};

/**
 * Construct full image URLs from array of paths
 * @param {Array<string>} imagePaths - Array of relative paths
 * @returns {Array<string>} Array of full image URLs
 */
export const getImageUrls = (imagePaths) => {
  if (!Array.isArray(imagePaths)) return [];
  return imagePaths.map(getImageUrl).filter(Boolean);
};

/**
 * Get avatar URL with fallback
 * @param {Object} user - User object with avatar or profileImage
 * @returns {string|null} Full avatar URL or null
 */
export const getAvatarUrl = (user) => {
  if (!user) return null;

  // Prioritize avatar field
  if (user.avatar) {
    return getImageUrl(user.avatar);
  }

  // Fallback to profileImage
  if (user.profileImage) {
    return getImageUrl(user.profileImage);
  }

  return null;
};
