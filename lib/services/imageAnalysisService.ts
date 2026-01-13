/**
 * Image Analysis Service
 * 
 * Modular service for analyzing images using AI vision models
 * Generates titles, descriptions, and metadata for uploaded images
 */

export interface ImageAnalysisResult {
  title: string;
  content: string;
  suggestedTags?: string[];
  suggestedCategory?: string;
  confidence: number;
}

export interface ImageAnalysisOptions {
  generateTitle?: boolean;
  generateContent?: boolean;
  generateTags?: boolean;
  generateCategory?: boolean;
  maxTitleLength?: number;
  maxContentLength?: number;
}

/**
 * Analyzes an image file and generates metadata
 */
export async function analyzeImage(
  file: File,
  options: ImageAnalysisOptions = {}
): Promise<ImageAnalysisResult> {
  const {
    generateTitle = true,
    generateContent = true,
    generateTags = true,
    generateCategory = true,
    maxTitleLength = 100,
    maxContentLength = 500,
  } = options;

  try {
    // Convert file to base64
    const base64Image = await fileToBase64(file);

    // Call the image analysis API
    const response = await fetch('/api/analyze-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        filename: file.name,
        mimeType: file.type,
        options: {
          generateTitle,
          generateContent,
          generateTags,
          generateCategory,
          maxTitleLength,
          maxContentLength,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Image analysis failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Image analysis error:', error);
    
    // Return fallback result based on filename
    const fallbackTitle = extractTitleFromFilename(file.name);
    return {
      title: fallbackTitle,
      content: '',
      confidence: 0,
    };
  }
}

/**
 * Analyzes multiple images in batch
 */
export async function analyzeImages(
  files: File[],
  options: ImageAnalysisOptions = {}
): Promise<ImageAnalysisResult[]> {
  // Analyze images in parallel for better performance
  const promises = files.map(file => analyzeImage(file, options));
  return Promise.all(promises);
}

/**
 * Checks if a file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Converts a File to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64Content = base64.split(',')[1];
      resolve(base64Content);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Extracts a reasonable title from filename as fallback
 */
function extractTitleFromFilename(filename: string): string {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  
  // Replace special characters with spaces
  const cleaned = nameWithoutExt.replace(/[_-]/g, ' ');
  
  // Capitalize first letter of each word
  const title = cleaned
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  return title || 'Uploaded Image';
}

/**
 * Validates image file before analysis
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check if it's an image
  if (!isImageFile(file)) {
    return { valid: false, error: 'File is not an image' };
  }

  // Check file size (max 10MB for analysis)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'Image file too large (max 10MB)' };
  }

  // Check supported formats
  const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!supportedFormats.includes(file.type)) {
    return { valid: false, error: 'Unsupported image format. Please use JPEG, PNG, GIF, or WebP' };
  }

  return { valid: true };
}
