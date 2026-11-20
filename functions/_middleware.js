// Inject shared authentication into public HTML responses, with a robust live-chat
// rewrite so it reuses the configured singleton client instead of redeclaring it.
const SUPABASE_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
const AUTH_LOADER = '<script src="/auth-global.js"></script>';
const AUTH_AREA = `<div id="authArea" style="display:flex;gap:8px;align-items:center;position:fixed;top:10px;right:10px;z-index:10000;background:white;padding:6px 10px;border-radius:20px;box-shadow:0 2px 8px rgba(0,0,0,.15);font:600 13px Segoe UI,sans-serif;color:#075E54">
  <button id="loginBtn" type="button" onclick="openAuth()" style="background:#075E54;color:white;border:none;padding:8px 14px;border-radius:20px;font-weight:700;cursor:pointer">Log In</button>
  <div id="userArea" style="display:none;align-items:center;gap:8px">
    <span id="userName" style="font-weight:700;font-size:13px"></span>
    <button type="button" onclick="doLogoutGlobal()" style="background:#eee;border:none;padding:6px 12px;border-radius:20px;cursor:pointer;font-size:12px">Log Out</button>
  </div>
</div>`;
const AUTH_MODAL = `<div id="authModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:10001;align-items:center;justify-content:center;padding:14px;font-family:Segoe UI,sans-serif">
  <div style="background:white;border-radius:14px;padding:20px;width:100%;max-width:380px;color:#111;box-sizing:border-box">
    <h3 style="margin:0 0 10px;color:#075E54">Log In / Sign Up</h3>
    <div id="authMsg" role="status" style="display:none;padding:10px;border-radius:8px;font-size:13px;margin-bottom:10px;background:#FEE2E2;color:#991B1B"></div>
    <input id="idxName" autocomplete="name" placeholder="Full name (Sign Up only)" style="width:100%;padding:12px;border:1px solid #E5E5E5;border-radius:10px;margin-bottom:8px;box-sizing:border-box">
    <input id="idxEmail" type="email" autocomplete="email" placeholder="Email" style="width:100%;padding:12px;border:1px solid #E5E5E5;border-radius:10px;margin-bottom:8px;box-sizing:border-box">
    <input id="idxPass" type="password" autocomplete="current-password" placeholder="Password" style="width:100%;padding:12px;border:1px solid #E5E5E5;border-radius:10px;margin-bottom:10px;box-sizing:border-box">
    <button type="button" onclick="doLoginGlobal()" style="width:100%;padding:12px;background:#075E54;color:white;border:none;border-radius:10px;font-weight:700;margin-bottom:8px;cursor:pointer">Log In</button>
    <button type="button" onclick="doSignupGlobal()" style="width:100%;padding:12px;background:white;color:#075E54;border:1px solid #075E54;border-radius:10px;font-weight:700;cursor:pointer">Create Account</button>
    <p onclick="closeAuth()" style="text-align:center;color:#667781;font-size:13px;cursor:pointer;margin:12px 0 0">Close ✕</p>
  </div>
</div>`;
const SHARED_SCRIPTS = `<script src="${SUPABASE_CDN}"></script>${AUTH_LOADER}`;

export async function onRequest(context) {
  const response = await context.next();
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("text/html")) return response;

  const pathname = new URL(context.request.url).pathname.toLowerCase();
  const isLiveChat = pathname === "/live-chat.html";
  let html = await response.text();

  // Keep exactly one SDK include, then load the singleton before page inline scripts.
  html = html.replace(/<script\b[^>]*src=["'][^"']*cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js[^"']*["'][^>]*>\s*<\/script>/gi, "");
  if (!html.includes("/auth-global.js") && !html.includes("auth-global.js")) {
    html = html.replace(/<head\b[^>]*>/i, (head) => `${head}${SHARED_SCRIPTS}`);
  } else if (!html.includes(SUPABASE_CDN)) {
    html = html.replace(/<head\b[^>]*>/i, (head) => `${head}<script src="${SUPABASE_CDN}"></script>`);
  } else {
    // Existing auth loader: ensure SDK is present before it.
    html = html.replace(/(<script\b[^>]*src=["'][^"']*auth-global\.js[^"']*["'][^>]*>\s*<\/script>)/i, `<script src="${SUPABASE_CDN}"></script>$1`);
  }

  if (!html.includes('id="authArea"') && !html.includes("id='authArea'")) {
    html = html.replace(/<body\b[^>]*>/i, (body) => `${body}${AUTH_AREA}`);
  }
  if (!html.includes('id="authModal"') && !html.includes("id='authModal'")) {
    html = html.replace(/<\/body>/i, `${AUTH_MODAL}</body>`);
  }

  if (isLiveChat) {
    // Remove old client configuration/client declarations to avoid global lexical conflicts.
    html = html
      .replace(/^\s*const\s+SUPABASE_URL\s*=\s*["'][^"']+["'];\s*/gm, "")
      .replace(/^\s*const\s+SUPABASE_KEY\s*=\s*["'][^"']+["'];\s*/gm, "")
      .replace(/^\s*const\s+ADMIN_EMAIL\s*=\s*["'][^"']+["'];\s*/gm, "")
      .replace(/^\s*const\s+supabaseClient\s*=\s*supabase\.createClient\([^;]+;\s*/gm, "");
    // All chat operations now use the singleton created by auth-global.js.
    html = html.replace(/\bsupabaseClient\b/g, "window.supabaseClient");
    // Ensure the modal and auth script precede the chat script and exist only once.
    html = html.replace(/(<div id="authModal"[\s\S]*?<\/div>\s*<\/div>)/i, `$1<script src="/auth-global.js"></script>`);
  }

  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
