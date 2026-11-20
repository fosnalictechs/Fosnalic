// Inject shared auth UI and bootstrap into public HTML without editing every page.
const PRIVATE_OR_UTILITY_PATHS = new Set([
  "/admin.html",
  "/dashboard.html",
  "/depot.html",
  "/my-files.html",
  "/phone.html",
  "/phone_sync.html",
  "/storage.html",
  "/tracker.html",
]);
const SUPABASE_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

const AUTH_AREA = `<div id="authArea" style="display:flex;gap:8px;align-items:center;margin-left:12px;font:600 13px Segoe UI,sans-serif;color:#075E54">
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

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname.toLowerCase();
  if (PRIVATE_OR_UTILITY_PATHS.has(pathname)) return context.next();

  const response = await context.next();
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("text/html")) return response;

  const isLiveChat = pathname === "/live-chat.html";
  const transform = new HTMLRewriter()
    // Remove any per-page SDK include, then inject exactly one SDK and the singleton auth client.
    .on(`script[src="${SUPABASE_CDN}"]`, { element(element) { element.remove(); } })
    .on("head", {
      element(element) {
        element.append(`<script src="${SUPABASE_CDN}"></script><script src="/auth-global.js"></script>`, { html: true });
        element.append('<script src="/fosnalic-remove-test-ad.js" defer></script>', { html: true });
        element.append('<script src="/fosnalic-announcements.js" defer></script>', { html: true });
      },
    })
    .on("header, .wa-top", {
      element(element) {
        element.append(AUTH_AREA, { html: true });
      },
    })
    .on("body", {
      element(element) {
        element.append(AUTH_MODAL, { html: true });
      },
    });

  if (isLiveChat) {
    // Keep chat behavior intact while replacing its old client construction with the shared singleton.
    transform.on("script:not([src])", {
      text(text) {
        const patched = text.text
          .replace(/^\s*const\s+SUPABASE_URL\s*=\s*["'][^"']+["'];\s*/gm, "")
          .replace(/^\s*const\s+SUPABASE_KEY\s*=\s*["'][^"']+["'];\s*/gm, "")
          .replace(/^\s*const\s+supabaseClient\s*=\s*supabase\.createClient\(SUPABASE_URL\s*,\s*SUPABASE_KEY\s*\)\s*;\s*/gm, "const supabaseClient = window.supabaseClient;\n");
        if (patched !== text.text) text.replace(patched);
      },
    });
  }

  return transform.transform(response);
}
