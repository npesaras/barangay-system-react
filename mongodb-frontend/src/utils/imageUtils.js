/**
 * Formats the image URL from a file path
 * @param {string} profileImage - The file path or URL of the image
 * @returns {string|null} The formatted URL or null if no path provided
 */
export const getImageUrl = (profileImage) => {
  if (!profileImage) return null;
  
  // If the profile image is already a full URL, return it
  if (profileImage.startsWith('http://') || profileImage.startsWith('https://')) {
    return profileImage;
  }
  
  // Get the base API URL from environment or default
  const API_URL = 'http://localhost:5000';
  
  // Clean up the profile image path
  const cleanPath = profileImage
    .replace(/^\/+/, '')
    .replace(/\\/g, '/')
    .replace(/^uploads\/profiles\//, '')
    .replace(/^profiles\//, '');
  
  // Return the full URL to the image
  return `${API_URL}/uploads/profiles/${cleanPath}`;
}; 