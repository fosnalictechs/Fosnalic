// Inject shared authentication into HTML responses. The auth client is loaded in <head>
// so page scripts (notably live-chat.html) can use it without constructing another client.
const SUPABASE_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
const AUTH_LOADER = '<script src="/auth-global.js"></script>';
const AUTH_AREA = `<div id="authArea" style="display:flex;gap:8px;align-items:center;position:fixed;top:10px;right:10px;z-index:10000;background:#fff;padding:6px;border-radius:22px;box-shadow:0 2px 10px #0002;font:600 13px Segoe UI,sans-serif;color:#075E54">
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
  const response = await context.next();
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("text/html")) return response;

  const pathname = new URL(context.request.url).pathname.toLowerCase();
  const isLiveChat = pathname === "/live-chat.html";
  // Read a clone only to avoid injecting duplicate UI or bootstrap tags already in source HTML.
  const source = await response.clone().text();
  const needsAuthArea = !/\bid=["']authArea["']/i.test(source);
  const needsAuthModal = !/\bid=["']authModal["']/i.test(source);
  const needsSdk = !source.includes(SUPABASE_CDN);
  const needsAuthLoader = !source.includes("auth-global.js");

  const rewriter = new HTMLRewriter()
    // Normalize the SDK include to a single copy. Auth script follows it in the head.
    .on('script[src*="cdn.jsdelivr.net/npm/@supabase/supabase-js"]', {
      element(element) { element.remove(); },
    })
    .on("head", {
      element(element) {
        const scripts = `${needsSdk ? `<script src="${SUPABASE_CDN}"></script>` : `<script src="${SUPABASE_CDN}"></script>`}${needsAuthLoader ? AUTH_LOADER : ""}`;
        // Prepend so the SDK/client is ready before any inline page code runs.
        element.prepend(scripts, { html: true });
        element.append('<script src="/fosnalic-remove-test-ad.js" defer></script>', { html: true });
        element.append('<script src="/fosnalic-announcements.js" defer></script>', { html: true });
      },
    })
    .on("header, .wa-top", {
      element(element) {
        if (needsAuthArea) element.append(AUTH_AREA, { html: true });
      },
    })
    .on("body", {
      element(element) {
        // Pages without a standard header still get a reachable login button.
        if (needsAuthArea && !source.includes("<header") && !source.includes("class=\"wa-top\"")) {
          element.prepend(AUTH_AREA, { html: true });
        }
        if (needsAuthModal) element.append(AUTH_MODAL, { html: true });
      },
    });

  if (isLiveChat) {
    // auth-global.js declares these shared bindings. Remove the legacy duplicate client
    // (and same-name config bindings) while leaving all chat behavior untouched.
    rewriter.on("script:not([src])", {
      text(text) {
        const patched = text.text
          .replace(/^\s*const\s+SUPABASE_URL\s*=\s*["'][^"']+["'];\s*/gm, "")
          .replace(/^\s*const\s+SUPABASE_KEY\s*=\s*["'][^"']+["'];\s*/gm, "")
          .replace(/^\s*const\s+ADMIN_EMAIL\s*=\s*["'][^"']+["'];\s*/gm, "")
          .replace(/^\s*const\s+supabaseClient\s*=\s*supabase\.createClient\([^;]+;\s*/gm, "");
        if (patched !== text.text) text.replace(patched);
      },
    });
  }

  return rewriter.transform(response);
}
