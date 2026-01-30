/**
 * Normalizes a website URL by adding https:// if no protocol is present.
 * Handles common cases like:
 * - "example.com" -> "https://example.com"
 * - "www.example.com" -> "https://www.example.com"
 * - "https://example.com" -> "https://example.com" (unchanged)
 * - "http://example.com" -> "http://example.com" (unchanged)
 * - Empty string -> empty string
 */
export function normalizeWebsiteUrl(url: string): string {
  if (!url || !url.trim()) {
    return "";
  }

  const trimmed = url.trim();

  // If it already has a protocol, return as-is
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Add https:// if no protocol
  return `https://${trimmed}`;
}
