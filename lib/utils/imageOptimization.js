/**
 * Image Optimization Utilities
 * Helper functions for optimized image loading
 */

/**
 * Generate blur placeholder for images
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {string} Base64 encoded blur placeholder
 */
export function generateBlurPlaceholder(width = 10, height = 10) {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f3f4f6"/>
    </svg>
  `;
  
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Get optimized Cloudinary URL
 * @param {string} url - Original image URL
 * @param {Object} options - Optimization options
 * @returns {string} Optimized URL
 */
export function getOptimizedCloudinaryUrl(url, options = {}) {
  if (!url || !url.includes('cloudinary')) return url;
  
  const {
    width = 800,
    quality = 'auto',
    format = 'auto',
  } = options;
  
  // Insert transformations into Cloudinary URL
  const transformations = `w_${width},q_${quality},f_${format}`;
  return url.replace('/upload/', `/upload/${transformations}/`);
}

/**
 * Image loading skeleton component props
 */
export const imageSkeletonProps = {
  className: "animate-pulse bg-gray-200",
};

/**
 * Common image props for Next.js Image component
 */
export const commonImageProps = {
  loading: "lazy",
  placeholder: "blur",
  quality: 85,
  blurDataURL: generateBlurPlaceholder(),
};

/**
 * Priority image props (for above-the-fold images)
 */
export const priorityImageProps = {
  priority: true,
  quality: 90,
  placeholder: "blur",
  blurDataURL: generateBlurPlaceholder(),
};

export default {
  generateBlurPlaceholder,
  getOptimizedCloudinaryUrl,
  commonImageProps,
  priorityImageProps,
  imageSkeletonProps,
};
