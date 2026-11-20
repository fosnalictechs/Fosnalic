// Shared Supabase authentication bootstrap for public site pages.
(() => {
  "use strict";

  const SUPABASE_URL = "https://lqqbvzttjstchkjfajwj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_OD5wXFcYixFPoaQuRXcMoA_DIBcjRM7";
  const STORAGE_KEY = "sb-lqqbvzttjstchkjfajwj-auth-token";
  const ADMIN_EMAIL = "possyshad@gmail.com";
  const supabaseSdk = window.supabase;
  if (!supabaseSdk) return;

  // Reuse a single client and force every legacy createClient call on this page
  // (including live-chat.html) to resolve to that same configured instance.
  let client = window.supabaseClient || null;
  const originalCreateClient = supabaseSdk.createClient.bind(supabaseSdk);
  function getClient() {
    if (!client) {
      client = originalCreateClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: STORAGE_KEY,
          storage: window.localStorage,
        },
      });
      window.supabaseClient = client;
    }
    return client;
  }
  supabaseSdk.createClient = function () { return getClient(); };
  getClient();

  const style = document.createElement("style");
  style.textContent = `
    .fos-global-auth{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap;font:600 13px/1.3 'Segoe UI',sans-serif;color:#1a365d}
    .fos-global-auth button{border:0;border-radius:20px;padding:8px 13px;background:#1a365d;color:#fff;font-weight:700;cursor:pointer}
    .fos-global-auth .fos-auth-logout{background:#64748b}
    .fos-global-auth .fos-auth-name{max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    #fosGlobalAuthModal{position:fixed;inset:0;z-index:10001;background:rgba(15,23,42,.7);display:none;align-items:center;justify-content:center;padding:16px;font-family:'Segoe UI',sans-serif}
    #fosGlobalAuthModal .fos-auth-card{width:min(100%,420px);max-height:calc(100vh - 32px);overflow:auto;background:#fff;color:#0f172a;border-radius:16px;padding:22px;box-shadow:0 20px 70px rgba(0,0,0,.3)}
    #fosGlobalAuthModal h2{margin:0 0 5px;color:#1a365d;font-size:1.35rem}
    #fosGlobalAuthModal p{color:#64748b;font-size:13px;margin:0 0 14px}
    #fosGlobalAuthModal input{display:block;width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:9px;margin:9px 0;font:inherit;font-size:15px;box-sizing:border-box}
    #fosGlobalAuthModal .fos-auth-actions{display:flex;gap:8px;margin-top:12px}
    #fosGlobalAuthModal .fos-auth-actions button{flex:1;padding:11px 8px;border:0;border-radius:9px;background:#1a365d;color:white;font-weight:700;cursor:pointer}
    #fosGlobalAuthModal .fos-auth-actions .fos-auth-secondary{background:#e2e8f0;color:#0f172a}
    #fosGlobalAuthModal .fos-auth-close{float:right;border:0;background:transparent;color:#475569;font-size:23px;cursor:pointer}
    #fosGlobalAuthModal .fos-auth-msg{min-height:20px;color:#b91c1c;font-size:13px;margin-top:8px}
    #fosGlobalAuthModal .fos-auth-msg[data-ok="true"]{color:#15803d}
    @media(max-width:950px){header .fos-global-auth{display:none}}
  `;

  function openAuth() {
    const modal = document.getElementById("fosGlobalAuthModal");
    if (!modal) return;
    modal.style.display = "flex";
    document.getElementById("idxEmail")?.focus();
  }
  function closeAuth() {
    const modal = document.getElementById("fosGlobalAuthModal");
    if (modal) modal.style.display = "none";
  }
  function showAuthMsg(message, ok = false) {
    const element = document.getElementById("authMsg");
    if (!element) return;
    element.textContent = message;
    element.dataset.ok = ok ? "true" : "false";
    element.style.display = "block";
  }

  function createAuthArea(mobile = false) {
    const area = document.createElement("div");
    area.className = "fos-global-auth";
    area.dataset.fosAuthArea = mobile ? "mobile" : "desktop";
    area.innerHTML = mobile
      ? '<button type="button" class="fos-login-trigger">Log In</button><span class="fos-auth-name" hidden></span><button type="button" class="fos-auth-logout" hidden>Log Out</button>'
      : '<button type="button" id="loginBtn" class="fos-login-trigger">Log In</button><div id="userArea" style="display:none;align-items:center;gap:8px"><span id="userName" class="fos-auth-name"></span><button type="button" class="fos-auth-logout">Log Out</button></div>';
    area.querySelector(".fos-login-trigger").addEventListener("click", openAuth);
    area.querySelector(".fos-auth-logout").addEventListener("click", logout);
    return area;
  }

  function ensureAuthAreas() {
    if (!document.querySelector('[data-fos-auth-area="desktop"]')) {
      const target = document.querySelector("header .container, header .container-fluid, header .desktop-nav, header nav, header, .wa-top");
      if (target) target.appendChild(createAuthArea(false));
      else if (document.body) {
        const fallback = createAuthArea(false);
        fallback.style.cssText += ";position:fixed;top:10px;right:10px;z-index:10000;background:#fff;padding:6px;border-radius:22px;box-shadow:0 2px 10px #0002";
        document.body.appendChild(fallback);
      }
    }

    const mobileMenu = document.querySelector("#mobileMenu, .mobile-menu");
    if (mobileMenu && !mobileMenu.querySelector('[data-fos-auth-area="mobile"]')) {
      mobileMenu.insertBefore(createAuthArea(true), mobileMenu.firstChild);
    }
  }

  function ensureModal() {
    if (document.getElementById("fosGlobalAuthModal")) return;
    const modal = document.createElement("div");
    modal.id = "fosGlobalAuthModal";
    modal.innerHTML = `
      <section class="fos-auth-card" role="dialog" aria-modal="true" aria-labelledby="fosAuthTitle">
        <button type="button" class="fos-auth-close" aria-label="Close">×</button>
        <h2 id="fosAuthTitle">FOSNALIC Community</h2>
        <p>Log in or create an account. Your login works across the site.</p>
        <input id="idxName" autocomplete="name" placeholder="Name (for new accounts)" aria-label="Name">
        <input id="idxEmail" type="email" autocomplete="email" placeholder="Email address" aria-label="Email address">
        <input id="idxPass" type="password" autocomplete="current-password" placeholder="Password" aria-label="Password">
        <div class="fos-auth-actions"><button type="button" id="fosGlobalLogin">Log In</button><button type="button" id="fosGlobalSignup" class="fos-auth-secondary">Create Account</button></div>
        <div id="authMsg" class="fos-auth-msg" role="status" aria-live="polite"></div>
      </section>`;
    document.body.appendChild(modal);
    modal.querySelector(".fos-auth-close").addEventListener("click", closeAuth);
    modal.addEventListener("click", (event) => { if (event.target === modal) closeAuth(); });
    document.getElementById("fosGlobalLogin").addEventListener("click", doLoginGlobal);
    document.getElementById("fosGlobalSignup").addEventListener("click", doSignupGlobal);
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeAuth(); });
  }

  function updateAuthAreas(user) {
    document.querySelectorAll("[data-fos-auth-area]").forEach((area) => {
      const login = area.querySelector(".fos-login-trigger");
      const userArea = area.querySelector("#userArea");
      const nameElement = area.querySelector("#userName, .fos-auth-name");
      const logoutButton = area.querySelector(".fos-auth-logout");
      if (!user) {
        if (login) login.style.display = "inline-block";
        if (userArea) userArea.style.display = "none";
        if (nameElement && !userArea) nameElement.hidden = true;
        if (logoutButton && !userArea) logoutButton.hidden = true;
        return;
      }
      const name = user.user_metadata?.full_name || user.user_metadata?.name || (user.email || "User").split("@")[0];
      const isAdmin = (user.email || "").toLowerCase() === ADMIN_EMAIL;
      if (login) login.style.display = "none";
      if (userArea) userArea.style.display = "flex";
      if (nameElement) {
        nameElement.textContent = `👋 ${name}${isAdmin ? " 🛡️" : ""}`;
        nameElement.hidden = false;
      }
      if (logoutButton) logoutButton.hidden = false;
    });
  }

  async function checkLoginGlobal() {
    ensureAuthAreas();
    const { data, error } = await getClient().auth.getSession();
    if (error) console.warn("Could not check FOSNALIC login session", error);
    updateAuthAreas(data.session?.user || null);
  }

  async function doLoginGlobal() {
    const email = document.getElementById("idxEmail")?.value.trim();
    const password = document.getElementById("idxPass")?.value;
    if (!email || !password) return showAuthMsg("Enter email and password.");
    const { error } = await getClient().auth.signInWithPassword({ email, password });
    if (error) return showAuthMsg(error.message);
    closeAuth();
    await checkLoginGlobal();
  }

  async function doSignupGlobal() {
    const name = document.getElementById("idxName")?.value.trim();
    const email = document.getElementById("idxEmail")?.value.trim();
    const password = document.getElementById("idxPass")?.value;
    if (!name || !email || !password) return showAuthMsg("Fill name, email and password.");
    if (password.length < 6) return showAuthMsg("Password must be at least 6 characters.");
    const { data, error } = await getClient().auth.signUp({ email, password, options: { data: { full_name: name } } });
    if (error) return showAuthMsg(error.message);
    if (data.session) {
      closeAuth();
      await checkLoginGlobal();
    } else {
      showAuthMsg("Account created! Check your email to verify it, then log in.", true);
    }
  }

  async function logout() {
    const { error } = await getClient().auth.signOut();
    if (error) return showAuthMsg(error.message);
    updateAuthAreas(null);
  }

  window.openAuth = openAuth;
  window.closeAuth = closeAuth;
  window.showAuthMsg = showAuthMsg;
  window.checkLoginGlobal = checkLoginGlobal;
  window.doLoginGlobal = doLoginGlobal;
  window.doSignupGlobal = doSignupGlobal;
  window.doLogoutGlobal = logout;

  function init() {
    document.head.appendChild(style);
    ensureAuthAreas();
    ensureModal();
    checkLoginGlobal();
    getClient().auth.onAuthStateChange((_event, session) => updateAuthAreas(session?.user || null));
    new MutationObserver(ensureAuthAreas).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
