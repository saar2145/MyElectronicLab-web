// Version: 2.0
// Title: Cloudinary Transform Helper | Important Data: added c_limit - prevents
// Cloudinary from upscaling images whose original resolution is smaller than the
// requested width. Without this flag, small-source images get stretched to fill
// the requested w_N, causing visible blur. With c_limit, a small image simply
// renders at its native (smaller) size within the container instead - stays sharp.
// This is why some product images looked crisp and others blurry: source photo
// quality varies per product (different AliExpress sellers), and upscaling made
// the gap visually obvious.

export function cloudinaryTransform(
  url: string | null | undefined,
  params: string
): string {
  if (!url || !url.includes('res.cloudinary.com')) return url ?? '';
  // c_limit חייב לבוא לפני w_N בפרמטרים כדי לחול נכון על ה-resize
  return url.replace('/upload/', `/upload/c_limit,${params}/`);
}
