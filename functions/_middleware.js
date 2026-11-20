// Inject shared authentication on public HTML pages without floating controls.
const PRIVATE_OR_UTILITY_PATHS = new Set([
  "/admin.html", "/auth.html", "/dashboard.html", "/depot.html",
  "/my-files.html", "/phone.html", "/phone_sync.html", "/storage.html", "/tracker.html",
]);
const SUPABASE_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
const AUTH_LOADER = '<script src="/auth-global.js"></script>';
const AUTH_AREA = `<div id="authArea" style="display:inline-flex;gap:6px;align-items:center;flex-shrink:0;margin-left:auto;position:static;z-index:auto">
  <button id="loginBtn" type="button" onclick="openAuth()" style="background:#075E54;color:white;border:none;padding:6px 12px;border-radius:20px;font-weight:700;cursor:pointer;font-size:12px;white-space:nowrap">Log In</button>
  <div id="userArea" style="display:none;align-items:center;gap:6px">
    <span id="userName" style="font-weight:700;font-size:12px;max-width:100px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></span>
    <button type="button" onclick="doLogoutGlobal()" style="background:#eee;border:none;padding:5px 10px;border-radius:20px;cursor:pointer;font-size:11px;white-space:nowrap">Sign Out</button>
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
  const response = await context.next();
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("text/html")) return response;

  const isPrivateUtility = PRIVATE_OR_UTILITY_PATHS.has(pathname);
  const source = await response.clone().text();
  const hasHeader = /<header\b/i.test(source) || /class=["'][^"']*\bwa-top\b/i.test(source);
  const hasNav = /<nav\b/i.test(source);
  const hasAuthArea = /\bid=["']authArea["']/i.test(source);
  const hasAuthModal = /\bid=["']authModal["']/i.test(source);

  let rewriter = new HTMLRewriter()
    // Normalize any existing SDK/auth loader so there is one ordered pair.
    .on('script[src*="cdn.jsdelivr.net/npm/@supabase/supabase-js"]', { element(element) { element.remove(); } })
    .on('script[src*="auth-global.js"]', { element(element) { element.remove(); } })
    .on("head", {
      element(element) {
        if (!isPrivateUtility) {
          element.append(`<script src="${SUPABASE_CDN}"></script>${AUTH_LOADER}`, { html: true });
        }
        element.append('<script src="/fosnalic-remove-test-ad.js" defer></script>', { html: true });
        element.append('<script src="/fosnalic-announcements.js" defer></script>', { html: true });
      },
    })
    .on("#authArea", {
      element(element) {
        element.setAttribute("style", "display:inline-flex;gap:6px;align-items:center;flex-shrink:0;margin-left:auto;position:static;z-index:auto");
      },
    })
    .on("#loginBtn", {
      element(element) {
        element.setAttribute("style", "background:#075E54;color:white;border:none;padding:6px 12px;border-radius:20px;font-weight:700;cursor:pointer;font-size:12px;white-space:nowrap");
      },
    })
    .on("#userArea", {
      element(element) {
        element.setAttribute("style", "display:none;align-items:center;gap:6px");
      },
    })
    .on("#userName", {
      element(element) {
        element.setAttribute("style", "font-weight:700;font-size:12px;max-width:100px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis");
      },
    });

  // Put the shared auth area at the end of the actual header/navigation, never fixed.
  if (!isPrivateUtility && !hasAuthArea) {
    if (hasHeader) {
      rewriter = rewriter.on("header, .wa-top", { element(element) { element.append(AUTH_AREA, { html: true }); } });
    } else if (hasNav) {
      rewriter = rewriter.on("nav", { element(element) { element.append(AUTH_AREA, { html: true }); } });
    } else {
      rewriter = rewriter.on("body", { element(element) {
        element.prepend(`<div style="display:flex;justify-content:flex-end;padding:8px">${AUTH_AREA}</div>`, { html: true });
      } });
    }
  }
  if (!isPrivateUtility && !hasAuthModal) {
    rewriter = rewriter.on("body", { element(element) { element.append(AUTH_MODAL, { html: true }); } });
  }

  if (pathname === "/live-chat.html") {
    rewriter = rewriter.on("script:not([src])", {
      text(text) {
        const patched = text.text
          .replace(/^\s*const\s+SUPABASE_URL\s*=\s*["'][^"']+["'];\s*/gm, "")
          .replace(/^\s*const\s+SUPABASE_KEY\s*=\s*["'][^"']+["'];\s*/gm, "")
          .replace(/^\s*const\s+ADMIN_EMAIL\s*=\s*["'][^"']+["'];\s*/gm, "")
          .replace(/^\s*const\s+supabaseClient\s*=\s*supabase\.createClient\([^;]+;\s*/gm, "")
          .replace(/\bsupabaseClient\b/g, "window.supabaseClient");
        if (patched !== text.text) text.replace(patched);
      },
    });
  }

  return rewriter.transform(response);
}
