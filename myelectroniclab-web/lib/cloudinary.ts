// Version: 1.0
// Title: Cloudinary Transform Helper | Important Data: injects f_auto,q_auto,w_N
// into Cloudinary URLs for automatic WebP + smart compression + responsive sizing.
// Mirrors the cloudinaryTransform_() logic from the original Index.html/Code.gs.

export function cloudinaryTransform(
  url: string | null | undefined,
  params: string
): string {
  if (!url || !url.includes('res.cloudinary.com')) return url ?? '';
  return url.replace('/upload/', `/upload/${params}/`);
}
