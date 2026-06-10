/**
 * Extract a session token from a scanned QR payload.
 * Handles full URLs (?token=, ?t=, or last path segment) and raw tokens.
 */
export function extractToken(raw: string): string | null {
  if (!raw) return null;
  const value = raw.trim();

  try {
    const url = new URL(value);
    const queryToken =
      url.searchParams.get("token") ?? url.searchParams.get("t");
    if (queryToken) return queryToken;

    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length > 0) return segments[segments.length - 1];
  } catch {
    // Not a URL — fall through and treat as a raw token.
  }

  return value || null;
}
