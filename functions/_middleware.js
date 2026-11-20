// Inject shared authentication on public HTML pages and normalize live-chat to use
// the shared Supabase singleton. The chat page keeps all of its chat-specific logic.
const SUPABASE_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
const AUTH_LOADER = '<script src="/auth-global.js"></script>';
const AUTH_AREA = `<div id="authArea" style="display:flex;gap:8px;align-items:center;position:fixed;top:10px;right:10px;z-index:10000;background:white;padding:6px 10px;border-radius:20px;box-shadow:0 2px 8px rgba(0,0,0,.15);font:600 13px Segoe UI,sans-serif;color:#075E54">
  <button id="loginBtn" type="button" onclick="openAuth()" style="background:#075E54;color:white;border:none;padding:8px 14px;border-radius:20px;font-weight:700;cursor:pointer">Log In</button>
  <div id="userArea" style="display:none;align-items:center;gap:8px"><span id="userName" style="font-weight:700;font-size:13px"></span><button type="button" onclick="doLogoutGlobal()" style="background:#eee;border:none;padding:6px 12px;border-radius:20px;cursor:pointer;font-size:12px">Log Out</button></div>
</div>`;
const AUTH_MODAL = `<div id="authModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:10001;align-items:center;justify-content:center;padding:14px;font-family:Segoe UI,sans-serif">
  <div style="background:white;border-radius:14px;padding:20px;width:100%;max-width:380px;color:#111;box-sizing:border-box"><h3 style="margin:0 0 10px;color:#075E54">Log In / Sign Up</h3>
  <div id="authMsg" role="status" style="display:none;padding:10px;border-radius:8px;font-size:13px;margin-bottom:10px;background:#FEE2E2;color:#991B1B"></div>
  <input id="idxName" autocomplete="name" placeholder="Full name (Sign Up only)" style="width:100%;padding:12px;border:1px solid #E5E5E5;border-radius:10px;margin-bottom:8px;box-sizing:border-box">
  <input id="idxEmail" type="email" autocomplete="email" placeholder="Email" style="width:100%;padding:12px;border:1px solid #E5E5E5;border-radius:10px;margin-bottom:8px;box-sizing:border-box">
  <input id="idxPass" type="password" autocomplete="current-password" placeholder="Password" style="width:100%;padding:12px;border:1px solid #E5E5E5;border-radius:10px;margin-bottom:10px;box-sizing:border-box">
  <button type="button" onclick="doLoginGlobal()" style="width:100%;padding:12px;background:#075E54;color:white;border:none;border-radius:10px;font-weight:700;margin-bottom:8px;cursor:pointer">Log In</button>
  <button type="button" onclick="doSignupGlobal()" style="width:100%;padding:12px;background:white;color:#075E54;border:1px solid #075E54;border-radius:10px;font-weight:700;cursor:pointer">Create Account</button>
  <p onclick="closeAuth()" style="text-align:center;color:#667781;font-size:13px;cursor:pointer;margin:12px 0 0">Close ✕</p></div>
</div>`;

function injectSharedAuth(html) {
  // Avoid duplicate SDK and auth-loader tags; the SDK must precede auth-global.js.
  html = html.replace(/<script\b[^>]*src=["'][^"']*cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js[^"']*["'][^>]*>\s*<\/script>/gi, "");
  html = html.replace(/<script\b[^>]*src=["'][^"']*\/auth-global\.js[^"']*["'][^>]*>\s*<\/script>/gi, "");
  const sharedScripts = `<script src="${SUPABASE_CDN}"></script>${AUTH_LOADER}`;
  html = html.replace(/<head\b[^>]*>/i, (head) => `${head}${sharedScripts}`);

  if (!/\bid=["']authArea["']/i.test(html)) {
    html = html.replace(/<body\b[^>]*>/i, (body) => `${body}${AUTH_AREA}`);
  }
  if (!/\bid=["']authModal["']/i.test(html)) {
    // Put the modal before page scripts, so inline handlers always have their elements.
    html = html.replace(/(<body\b[^>]*>[\s\S]*?)(<script\b)/i, `$1${AUTH_MODAL}$2`);
    if (!/\bid=["']authModal["']/i.test(html)) html = html.replace(/<\/body>/i, `${AUTH_MODAL}</body>`);
  }
  return html;
}

function useSharedClientInLiveChat(html) {
  // Strip the old client/config declarations (the auth loader owns these globals).
  html = html
    .replace(/^\s*const\s+SUPABASE_URL\s*=\s*["'][^"']+["'];\s*/gm, "")
    .replace(/^\s*const\s+SUPABASE_KEY\s*=\s*["'][^"']+["'];\s*/gm, "")
    .replace(/^\s*const\s+ADMIN_EMAIL\s*=\s*["'][^"']+["'];\s*/gm, "")
    .replace(/^\s*const\s+supabaseClient\s*=\s*supabase\.createClient\([^;]+;\s*/gm, "");

  // All remaining chat database/auth calls use exactly the shared singleton.
  html = html.replace(/\bsupabaseClient\b/g, "window.supabaseClient");
  return html;
}

export async function onRequest(context) {
  const response = await context.next();
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("text/html")) return response;

  const pathname = new URL(context.request.url).pathname.toLowerCase();
  let html = await response.text();
  if (pathname === "/live-chat.html") {
    html = injectSharedAuth(html);
    html = useSharedClientInLiveChat(html);
  } else {
    // Auth is intentionally kept out of private and utility pages.
    const privatePaths = new Set([
      "/admin.html", "/auth.html", "/dashboard.html", "/depot.html",
      "/my-files.html", "/phone.html", "/phone_sync.html", "/storage.html", "/tracker.html",
    ]);
    if (!privatePaths.has(pathname)) html = injectSharedAuth(html);
  }

  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
