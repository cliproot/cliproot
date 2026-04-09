import { Hono } from "hono";
import type { AppContext } from "../app.js";

type AuthMode = "sign-in" | "sign-up";

export function createAuthRoutes(ctx: AppContext) {
  const routes = new Hono();

  // BetterAuth catch-all: handles sign-up, sign-in, session, device flow, etc.
  // All BetterAuth endpoints live under /api/auth/*
  routes.all("/api/auth/*", async (c) => {
    return ctx.auth.handler(c.req.raw);
  });

  routes.get("/sign-in", (c) => {
    const callbackUrl = getValidatedCallbackUrl(
      ctx.config.baseUrl,
      c.req.query("callbackURL"),
    );
    if (c.req.query("callbackURL") && !callbackUrl) {
      return c.html(authErrorPage("Invalid callback URL."), 400);
    }
    return c.html(
      authPage(
        ctx.config.baseUrl,
        "sign-in",
        callbackUrl,
        Boolean(ctx.config.googleClientId && ctx.config.googleClientSecret),
      ),
    );
  });

  routes.get("/sign-up", (c) => {
    const callbackUrl = getValidatedCallbackUrl(
      ctx.config.baseUrl,
      c.req.query("callbackURL"),
    );
    if (c.req.query("callbackURL") && !callbackUrl) {
      return c.html(authErrorPage("Invalid callback URL."), 400);
    }
    return c.html(
      authPage(
        ctx.config.baseUrl,
        "sign-up",
        callbackUrl,
        Boolean(ctx.config.googleClientId && ctx.config.googleClientSecret),
      ),
    );
  });

  // Device verification page — user visits this URL from the CLI prompt.
  // Serves a simple HTML form where the user enters the device code.
  routes.get("/device", (c) => {
    const userCode = c.req.query("user_code") ?? "";
    return c.html(deviceVerificationPage(ctx.config.baseUrl, userCode));
  });

  return routes;
}

function authPage(
  baseUrl: string,
  mode: AuthMode,
  callbackUrl: string | undefined,
  googleEnabled: boolean,
): string {
  const isSignIn = mode === "sign-in";
  const title = isSignIn ? "Sign In" : "Create Account";
  const subtitle = isSignIn
    ? "Sign in to your Cliproot registry account."
    : "Create a Cliproot registry account to publish and sync clips.";
  const submitLabel = isSignIn ? "Sign In" : "Create Account";
  const switchLabel = isSignIn ? "Need an account?" : "Already have an account?";
  const switchHref = new URL(
    isSignIn ? "/sign-up" : "/sign-in",
    baseUrl,
  );
  if (callbackUrl) {
    switchHref.searchParams.set("callbackURL", callbackUrl);
  }
  const googleHref = new URL("/api/auth/sign-in/social", baseUrl);
  googleHref.searchParams.set("provider", "google");
  if (callbackUrl) {
    googleHref.searchParams.set("callbackURL", callbackUrl);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cliproot — ${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: linear-gradient(180deg, #f5f7fb 0%, #edf2fb 100%); color: #18212f; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 1.5rem; }
    .card { background: white; border-radius: 16px; padding: 2rem; max-width: 420px; width: 100%; box-shadow: 0 18px 48px rgba(32,54,94,0.12); border: 1px solid rgba(95,123,171,0.12); }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { font-size: 0.95rem; color: #526071; margin-bottom: 1.5rem; line-height: 1.5; }
    form { display: grid; gap: 0.9rem; }
    label { display: block; font-size: 0.88rem; font-weight: 600; margin-bottom: 0.35rem; }
    input { width: 100%; padding: 0.8rem 0.95rem; border: 1px solid #d8e0ea; border-radius: 10px; font-size: 1rem; background: #fbfcfe; }
    input:focus { outline: none; border-color: #4361ee; box-shadow: 0 0 0 3px rgba(67,97,238,0.14); background: white; }
    button { width: 100%; padding: 0.85rem 1rem; border: none; border-radius: 10px; background: #4361ee; color: white; font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.15s ease; }
    button:hover { background: #3650c9; }
    button:disabled { background: #9ca9df; cursor: not-allowed; }
    .secondary { display: inline-flex; justify-content: center; width: 100%; padding: 0.85rem 1rem; border-radius: 10px; border: 1px solid #d8e0ea; background: white; color: #18212f; font-weight: 600; text-decoration: none; }
    .divider { display: flex; align-items: center; gap: 0.8rem; color: #7b8794; font-size: 0.8rem; margin: 1rem 0; }
    .divider::before, .divider::after { content: ""; flex: 1; height: 1px; background: #e4e9f0; }
    .status { margin-top: 1rem; padding: 0.8rem 0.9rem; border-radius: 10px; font-size: 0.92rem; display: none; line-height: 1.45; }
    .status.error { display: block; background: #fdeced; color: #b42318; }
    .status.success { display: block; background: #ecfdf3; color: #067647; }
    .switch-link { margin-top: 1.25rem; text-align: center; font-size: 0.9rem; color: #526071; }
    .switch-link a { color: #3650c9; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${subtitle}</p>
    <form id="auth-form">
      ${
        isSignIn
          ? ""
          : `<div>
        <label for="name">Name</label>
        <input type="text" id="name" name="name" autocomplete="name" required>
      </div>`
      }
      <div>
        <label for="email">Email</label>
        <input type="email" id="email" name="email" autocomplete="email" required>
      </div>
      <div>
        <label for="password">Password</label>
        <input type="password" id="password" name="password" autocomplete="${
          isSignIn ? "current-password" : "new-password"
        }" required minlength="8">
      </div>
      <button type="submit" id="submit-btn">${submitLabel}</button>
    </form>
    ${
      googleEnabled
        ? `<div class="divider">or</div>
    <a class="secondary" href="${escapeHtml(googleHref.toString())}">Continue with Google</a>`
        : ""
    }
    <div class="status" id="status"></div>
    <div class="switch-link">
      ${switchLabel} <a href="${escapeHtml(switchHref.toString())}">${
        isSignIn ? "Create one" : "Sign in"
      }</a>
    </div>
  </div>
  <script>
    const mode = ${JSON.stringify(mode)};
    const baseUrl = ${JSON.stringify(baseUrl)};
    const callbackUrl = ${JSON.stringify(callbackUrl ?? "")};
    const form = document.getElementById('auth-form');
    const submitBtn = document.getElementById('submit-btn');
    const status = document.getElementById('status');

    function setStatus(kind, message) {
      status.className = 'status ' + kind;
      status.textContent = message;
      status.style.display = 'block';
    }

    function getErrorMessage(body) {
      if (!body || typeof body !== 'object') return 'Authentication failed.';
      if (typeof body.message === 'string') return body.message;
      if (typeof body.error_description === 'string') return body.error_description;
      if (typeof body.error === 'string') return body.error;
      if (body.error && typeof body.error.message === 'string') return body.error.message;
      return 'Authentication failed.';
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      submitBtn.disabled = true;
      submitBtn.textContent = mode === 'sign-in' ? 'Signing in...' : 'Creating account...';
      status.className = 'status';
      status.style.display = 'none';

      const formData = new FormData(form);
      const payload = {
        email: String(formData.get('email') || '').trim(),
        password: String(formData.get('password') || ''),
      };

      if (mode === 'sign-up') {
        payload.name = String(formData.get('name') || '').trim();
      }

      try {
        const endpoint = mode === 'sign-in'
          ? baseUrl + '/api/auth/sign-in/email'
          : baseUrl + '/api/auth/sign-up/email';
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        let body = null;
        try {
          body = await response.json();
        } catch {
          body = null;
        }

        if (!response.ok) {
          throw new Error(getErrorMessage(body));
        }

        const token = response.headers.get('set-auth-token')
          || (body && body.session && body.session.token)
          || (body && body.token)
          || '';

        if (callbackUrl) {
          const next = new URL(callbackUrl);
          if (next.origin !== window.location.origin && !token) {
            throw new Error('Signed in, but no bearer token was returned for the callback.');
          }
          if (next.origin !== window.location.origin && token) {
            next.searchParams.set('token', token);
          }
          window.location.assign(next.toString());
          return;
        }

        setStatus('success', mode === 'sign-in'
          ? 'Signed in successfully.'
          : 'Account created successfully.');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Authentication failed.';
        setStatus('error', message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = mode === 'sign-in' ? 'Sign In' : 'Create Account';
      }
    });
  </script>
</body>
</html>`;
}

function authErrorPage(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cliproot — Authentication Error</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f8f9fa; color: #1a1a2e; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 1.5rem; }
    .card { background: white; border-radius: 12px; padding: 2rem; max-width: 420px; width: 100%; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    h1 { font-size: 1.25rem; margin-bottom: 0.75rem; }
    p { color: #555; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Authentication Error</h1>
    <p>${escapeHtml(message)}</p>
  </div>
</body>
</html>`;
}

function deviceVerificationPage(baseUrl: string, prefillCode: string): string {
  const callbackUrl = new URL("/device", baseUrl);
  if (prefillCode) {
    callbackUrl.searchParams.set("user_code", prefillCode);
  }
  const signInUrl = new URL("/sign-in", baseUrl);
  signInUrl.searchParams.set("callbackURL", callbackUrl.toString());

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cliproot — Device Authorization</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #f8f9fa; color: #1a1a2e; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .card { background: white; border-radius: 12px; padding: 2rem; max-width: 420px; width: 100%; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    h1 { font-size: 1.25rem; margin-bottom: 0.5rem; }
    p { font-size: 0.9rem; color: #555; margin-bottom: 1.5rem; }
    label { display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.5rem; }
    input[type="text"] { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1.25rem; text-align: center; letter-spacing: 0.15em; text-transform: uppercase; }
    input[type="text"]:focus { outline: none; border-color: #4361ee; box-shadow: 0 0 0 3px rgba(67,97,238,0.15); }
    button { width: 100%; padding: 0.75rem; border: none; border-radius: 8px; background: #4361ee; color: white; font-size: 1rem; font-weight: 500; cursor: pointer; margin-top: 1rem; }
    button:hover { background: #3a56d4; }
    button:disabled { background: #aaa; cursor: not-allowed; }
    .status { margin-top: 1rem; padding: 0.75rem; border-radius: 8px; font-size: 0.9rem; display: none; }
    .status.error { display: block; background: #fce4ec; color: #c62828; }
    .status.success { display: block; background: #e8f5e9; color: #2e7d32; }
    .login-link { margin-top: 1rem; text-align: center; font-size: 0.85rem; }
    .login-link a { color: #4361ee; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Device Authorization</h1>
    <p>Enter the code shown in your terminal to authorize the CLI.</p>
    <form id="device-form">
      <label for="code">Device Code</label>
      <input type="text" id="code" name="code" maxlength="12" placeholder="ABCD1234"
        value="${escapeHtml(prefillCode)}" autocomplete="off" autofocus>
      <button type="submit" id="submit-btn">Authorize Device</button>
    </form>
    <div class="status" id="status"></div>
    <div class="login-link">
      Not logged in? <a href="${escapeHtml(signInUrl.toString())}" id="login-link">Sign in first</a>
    </div>
  </div>
  <script>
    const form = document.getElementById('device-form');
    const status = document.getElementById('status');
    const btn = document.getElementById('submit-btn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = document.getElementById('code').value.trim().replace(/-/g, '');
      if (!code) return;

      btn.disabled = true;
      btn.textContent = 'Authorizing...';
      status.className = 'status';
      status.style.display = 'none';

      try {
        const res = await fetch('${baseUrl}/api/auth/device/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userCode: code }),
          credentials: 'include',
        });
        const body = await res.json();

        if (res.ok && body.success) {
          status.className = 'status success';
          status.textContent = 'Device authorized! You can close this page and return to your terminal.';
          status.style.display = 'block';
          btn.textContent = 'Authorized';
        } else {
          const msg = body.error_description || body.message || 'Authorization failed.';
          if (msg.includes('Authentication required') || msg.includes('unauthorized')) {
            status.className = 'status error';
            status.textContent = 'You need to sign in first before authorizing.';
          } else {
            status.className = 'status error';
            status.textContent = msg;
          }
          status.style.display = 'block';
          btn.disabled = false;
          btn.textContent = 'Authorize Device';
        }
      } catch (err) {
        status.className = 'status error';
        status.textContent = 'Network error. Please try again.';
        status.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Authorize Device';
      }
    });
  </script>
</body>
</html>`;
}

function getValidatedCallbackUrl(
  baseUrl: string,
  rawCallbackUrl?: string,
): string | undefined {
  if (!rawCallbackUrl) {
    return undefined;
  }

  try {
    const callbackUrl = new URL(rawCallbackUrl);
    const registryUrl = new URL(baseUrl);

    if (callbackUrl.origin === registryUrl.origin) {
      return callbackUrl.toString();
    }

    if (
      callbackUrl.protocol === "chrome-extension:" ||
      callbackUrl.protocol === "moz-extension:"
    ) {
      return callbackUrl.toString();
    }

    if (
      (callbackUrl.protocol === "http:" || callbackUrl.protocol === "https:") &&
      isLocalCallbackHost(callbackUrl.hostname)
    ) {
      return callbackUrl.toString();
    }

    return undefined;
  } catch {
    return undefined;
  }
}

function isLocalCallbackHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]" ||
    hostname === "0.0.0.0" ||
    hostname.endsWith(".localhost")
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
