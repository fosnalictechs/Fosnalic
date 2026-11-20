(() => {
  "use strict";

  const SUPABASE_URL = "https://lqqbvzttjstchkjfajwj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_OD5wXFcYixFPoaQuRXcMoA_DIBcjRM7";
  const ADMIN_EMAIL = "possyshad@gmail.com";
  const STYLE_ID = "fosnalic-global-auth-styles";

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .fos-auth-entry{display:inline-flex;align-items:center;gap:8px;margin-left:10px;font:600 13px/1.3 'Segoe UI',sans-serif}
      .fos-auth-entry button,.fos-auth-mobile button{border:0;border-radius:20px;padding:9px 14px;background:#1a365d;color:#fff;font-weight:700;cursor:pointer}
      .fos-auth-entry .fos-auth-name{color:#1a365d;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .fos-auth-entry .fos-auth-logout,.fos-auth-mobile .fos-auth-logout{background:#64748b;padding:7px 11px}
      .fos-auth-mobile{padding:14px 0;border-bottom:1px solid #E2E8F0;display:flex;align-items:center;gap:8px;flex-wrap:wrap;font:600 13px 'Segoe UI',sans-serif;color:#1a365d}
      .fos-auth-modal{position:fixed;inset:0;z-index:10001;background:rgba(15,23,42,.68);display:none;align-items:center;justify-content:center;padding:16px}
      .fos-auth-modal[aria-hidden="false"]{display:flex}
      .fos-auth-card{width:min(100%,420px);max-height:calc(100vh - 32px);overflow:auto;background:#fff;color:#0f172a;border-radius:16px;padding:22px;box-shadow:0 20px 70px rgba(0,0,0,.3);font-family:'Segoe UI',sans-serif}
      .fos-auth-card h2{margin:0 0 5px;color:#1a365d;font-size:1.35rem}
      .fos-auth-card p{color:#64748b;font-size:13px;margin:0 0 14px}
      .fos-auth-card input{display:block;width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:9px;margin:9px 0;font:inherit;font-size:15px}
      .fos-auth-actions{display:flex;gap:8px;margin-top:12px}
      .fos-auth-actions button{flex:1;padding:11px 8px;border:0;border-radius:9px;background:#1a365d;color:white;font-weight:700;cursor:pointer}
      .fos-auth-actions .fos-auth-secondary{background:#e2e8f0;color:#0f172a}
      .fos-auth-close{float:right;border:0;background:transparent;color:#475569;font-size:23px;cursor:pointer;line-height:1}
      .fos-auth-status{min-height:20px;color:#b91c1c;font-size:13px;margin-top:8px}
      .fos-auth-status[data-ok="true"]{color:#15803d}
      @media(max-width:950px){.fos-auth-entry{display:none}}
    `;
    document.head.appendChild(style);
  }

  function makeEntry(isMobile) {
    const entry = document.createElement("div");
    entry.className = isMobile ? "fos-auth-mobile" : "fos-auth-entry";
    entry.setAttribute("data-fos-auth-entry", isMobile ? "mobile" : "desktop");
    return entry;
  }

  function renderEntry(entry, user) {
    entry.replaceChildren();
    if (!user) {
      const login = document.createElement("button");
      login.type = "button";
      login.textContent = "Log In";
      login.addEventListener("click", openModal);
      entry.appendChild(login);
      return;
    }

    const name = user.user_metadata?.full_name || user.user_metadata?.name || "User";
    const label = document.createElement("span");
    label.className = "fos-auth-name";
    label.textContent = `👋 ${name}${(user.email || "").toLowerCase() === ADMIN_EMAIL ? " 🛡️" : ""}`;
    entry.appendChild(label);

    const logout = document.createElement("button");
    logout.type = "button";
    logout.className = "fos-auth-logout";
    logout.textContent = "Log Out";
    logout.addEventListener("click", async () => {
      logout.disabled = true;
      const { error } = await authClient.auth.signOut();
      logout.disabled = false;
      if (error) showStatus(error.message);
    });
    entry.appendChild(logout);
  }

  function ensureEntries() {
    const nav = document.querySelector("header .desktop-nav, header nav, header .nav-links, header nav");
    const headerContainer = document.querySelector("header .container, header .container-fluid, header");
    if (nav && !document.querySelector('[data-fos-auth-entry="desktop"]')) {
      nav.appendChild(makeEntry(false));
    } else if (!nav && headerContainer && !document.querySelector('[data-fos-auth-entry="desktop"]')) {
      headerContainer.appendChild(makeEntry(false));
    }

    const mobileMenu = document.querySelector("#mobileMenu, .mobile-menu, .nav-links.active");
    if (mobileMenu && !mobileMenu.querySelector('[data-fos-auth-entry="mobile"]')) {
      const entry = makeEntry(true);
      const firstLink = mobileMenu.querySelector("a");
      mobileMenu.insertBefore(entry, firstLink || mobileMenu.firstChild);
    }
  }

  function ensureModal() {
    if (document.getElementById("fosAuthModal")) return;
    const modal = document.createElement("div");
    modal.id = "fosAuthModal";
    modal.className = "fos-auth-modal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <section class="fos-auth-card" role="dialog" aria-modal="true" aria-labelledby="fosAuthTitle">
        <button type="button" class="fos-auth-close" aria-label="Close">×</button>
        <h2 id="fosAuthTitle">FOSNALIC Community</h2>
        <p>Log in or create an account. Your login works across the site.</p>
        <form id="fosAuthForm">
          <input id="fosAuthName" autocomplete="name" placeholder="Name (for new accounts)" aria-label="Name">
          <input id="fosAuthEmail" type="email" autocomplete="email" placeholder="Email address" aria-label="Email address" required>
          <input id="fosAuthPassword" type="password" autocomplete="current-password" placeholder="Password (at least 6 characters)" aria-label="Password" required>
          <div class="fos-auth-actions">
            <button type="submit" id="fosAuthLogin">Log In</button>
            <button type="button" id="fosAuthSignup" class="fos-auth-secondary">Create Account</button>
          </div>
          <div id="fosAuthStatus" class="fos-auth-status" role="status" aria-live="polite"></div>
        </form>
      </section>`;
    document.body.appendChild(modal);
    modal.querySelector(".fos-auth-close").addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeModal(); });
    document.getElementById("fosAuthForm").addEventListener("submit", login);
    document.getElementById("fosAuthSignup").addEventListener("click", signup);
  }

  function openModal() {
    ensureModal();
    const modal = document.getElementById("fosAuthModal");
    modal.setAttribute("aria-hidden", "false");
    setTimeout(() => document.getElementById("fosAuthEmail")?.focus(), 0);
  }

  function closeModal() {
    const modal = document.getElementById("fosAuthModal");
    if (modal) modal.setAttribute("aria-hidden", "true");
  }

  function showStatus(message, ok = false) {
    const status = document.getElementById("fosAuthStatus");
    if (!status) return;
    status.textContent = message;
    status.dataset.ok = ok ? "true" : "false";
  }

  function setBusy(busy) {
    document.getElementById("fosAuthLogin").disabled = busy;
    document.getElementById("fosAuthSignup").disabled = busy;
  }

  async function login(event) {
    event.preventDefault();
    const email = document.getElementById("fosAuthEmail").value.trim();
    const password = document.getElementById("fosAuthPassword").value;
    setBusy(true);
    showStatus("Logging in…");
    const { error } = await authClient.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return showStatus(error.message);
    showStatus("Logged in successfully.", true);
    setTimeout(closeModal, 500);
  }

  async function signup() {
    const name = document.getElementById("fosAuthName").value.trim();
    const email = document.getElementById("fosAuthEmail").value.trim();
    const password = document.getElementById("fosAuthPassword").value;
    if (!name) return showStatus("Enter your name to create an account.");
    if (!email || !password) return showStatus("Enter your email and password.");
    if (password.length < 6) return showStatus("Password must be at least 6 characters.");
    setBusy(true);
    showStatus("Creating your account…");
    const { data, error } = await authClient.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    setBusy(false);
    if (error) return showStatus(error.message);
    if (data.session) {
      showStatus("Account created and logged in.", true);
      setTimeout(closeModal, 600);
    } else {
      showStatus("Account created. Check your email to verify it, then log in.", true);
    }
  }

  async function init() {
    if (!window.supabase || !document.body) return;
    addStyles();
    ensureEntries();
    ensureModal();

    // Supabase's default localStorage key is shared with live-chat.html for this project,
    // so signing in on any page restores the same session on the others.
    const authClient = window.fosnalicGlobalAuthClient || window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    window.fosnalicGlobalAuthClient = authClient;

    function update(user) {
      document.querySelectorAll("[data-fos-auth-entry]").forEach((entry) => renderEntry(entry, user));
    }

    const { data } = await authClient.auth.getSession();
    update(data.session?.user || null);
    authClient.auth.onAuthStateChange((_event, session) => update(session?.user || null));

    // Mobile menus may be created or replaced by the page's own menu code.
    const observer = new MutationObserver(() => ensureEntries());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Keep the client visible to handlers without declaring a top-level const that could
  // conflict with pages such as live-chat.html, which define their own Supabase client.
  let authClient;
  const originalInit = init;
  init = async function () {
    if (!window.supabase || !document.body) return;
    authClient = window.fosnalicGlobalAuthClient || window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    window.fosnalicGlobalAuthClient = authClient;
    addStyles();
    ensureEntries();
    ensureModal();
    function update(user) {
      document.querySelectorAll("[data-fos-auth-entry]").forEach((entry) => renderEntry(entry, user));
    }
    const { data } = await authClient.auth.getSession();
    update(data.session?.user || null);
    authClient.auth.onAuthStateChange((_event, session) => update(session?.user || null));
    const observer = new MutationObserver(() => ensureEntries());
    observer.observe(document.body, { childList: true, subtree: true });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
