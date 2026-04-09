import type { SessionInfo } from "./types.js";

/**
 * Returns the registry's browser sign-in page for a callback-based auth flow.
 * The caller opens this URL in a popup or tab; after authentication the registry
 * redirects back to `callbackUrl`, including a bearer token when needed.
 */
export function getAuthUrl(
  registryUrl: string,
  callbackUrl: string,
): string {
  const base = registryUrl.replace(/\/+$/, "");
  const params = new URLSearchParams({
    callbackURL: callbackUrl,
  });
  return `${base}/sign-in?${params.toString()}`;
}

/**
 * Returns the registry's browser sign-up page for callback-based registration.
 */
export function getSignUpUrl(
  registryUrl: string,
  callbackUrl: string,
): string {
  const base = registryUrl.replace(/\/+$/, "");
  const params = new URLSearchParams({
    callbackURL: callbackUrl,
  });
  return `${base}/sign-up?${params.toString()}`;
}

/**
 * Check whether a bearer token is still valid and retrieve the associated user.
 */
export async function checkSession(
  registryUrl: string,
  token: string,
  fetchFn: typeof fetch = globalThis.fetch.bind(globalThis),
): Promise<SessionInfo> {
  const base = registryUrl.replace(/\/+$/, "");
  const res = await fetchFn(`${base}/api/auth/get-session`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    return { valid: false };
  }

  const data = (await res.json()) as {
    user?: { id: string; name: string; email: string };
  };
  if (!data.user) {
    return { valid: false };
  }

  return { valid: true, user: data.user };
}
