// auth-global.js - unified Supabase auth client and modal handlers for all pages.
(() => {
  "use strict";

  const SUPABASE_URL = "https://lqqbvzttjstchkjfajwj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_OD5wXFcYixFPoaQuRXcMoA_DIBcjRM7";
  const ADMIN_EMAIL = "possyshad@gmail.com";
  const STORAGE_KEY = "sb-lqqbvzttjstchkjfajwj-auth-token";
  const AUTH_AREA_STYLE = "display:inline-flex;gap:6px;align-items:center;flex-shrink:0;margin-left:auto;position:relative;z-index:20";

  function getClient() {
    if (window.supabaseClient) return window.supabaseClient;
    if (!window.supabase) return null;
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: STORAGE_KEY,
        storage: window.localStorage,
      },
    });
    return window.supabaseClient;
  }

  function placeAuthArea() {
    const area = document.getElementById("authArea");
    if (!area) return;
    area.setAttribute("style", AUTH_AREA_STYLE);
    const headerRow = document.querySelector("header .navbar, header .container, header, .wa-top, nav");
    if (headerRow && area.parentElement !== headerRow) {
      headerRow.appendChild(area);
    }
  }

  function openAuth() {
    const modal = document.getElementById("authModal");
    if (!modal) return;
    modal.style.display = "flex";
    modal.style.pointerEvents = "auto";
    const message = document.getElementById("authMsg");
    if (message) {
      message.textContent = "";
      message.style.display = "none";
    }
    document.getElementById("idxEmail")?.focus();
  }

  function closeAuth() {
    const modal = document.getElementById("authModal");
    if (modal) modal.style.display = "none";
  }

  function showAuthMsg(message, isSuccess = false) {
    const element = document.getElementById("authMsg");
    if (!element) return;
    element.textContent = message;
    element.style.display = "block";
    element.style.background = isSuccess ? "#DCFCE7" : "#FEE2E2";
    element.style.color = isSuccess ? "#166534" : "#991B1B";
  }

  function applyUserUI(user) {
    const loginButton = document.getElementById("loginBtn");
    const userArea = document.getElementById("userArea");
    const userName = document.getElementById("userName");
    if (!user) {
      if (loginButton) loginButton.style.display = "inline-block";
      if (userArea) userArea.style.display = "none";
      return;
    }
    const name = user.user_metadata?.full_name || user.user_metadata?.name || (user.email || "User").split("@")[0];
    const isAdmin = (user.email || "").toLowerCase() === ADMIN_EMAIL;
    if (loginButton) loginButton.style.display = "none";
    if (userArea) userArea.style.display = "flex";
    if (userName) userName.textContent = `👋 ${name}${isAdmin ? " 🛡️" : ""}`;
  }

  async function checkLoginGlobal() {
    placeAuthArea();
    const client = getClient();
    if (!client) return null;
    const { data, error } = await client.auth.getSession();
    if (error) console.warn("Session read warning:", error.message);
    const user = data?.session?.user || null;
    applyUserUI(user);
    return user;
  }

  async function doLoginGlobal() {
    const client = getClient();
    if (!client) return showAuthMsg("Authentication service still loading. Try again.");
    const email = document.getElementById("idxEmail")?.value.trim();
    const password = document.getElementById("idxPass")?.value;
    if (!email || !password) return showAuthMsg("Enter email and password.");
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) return showAuthMsg(error.message);
    closeAuth();
    await checkLoginGlobal();
  }

  async function doSignupGlobal() {
    const client = getClient();
    if (!client) return showAuthMsg("Authentication service still loading. Try again.");
    const name = document.getElementById("idxName")?.value.trim();
    const email = document.getElementById("idxEmail")?.value.trim();
    const password = document.getElementById("idxPass")?.value;
    if (!name || !email || !password) return showAuthMsg("Fill name, email and password.");
    if (password.length < 6) return showAuthMsg("Password must be at least 6 characters.");
    const { data, error } = await client.auth.signUp({ email, password, options: { data: { full_name: name } } });
    if (error) return showAuthMsg(error.message);
    if (data.session) {
      closeAuth();
      await checkLoginGlobal();
    } else {
      showAuthMsg("Account created! Check your email to verify, then log in.", true);
    }
  }

  async function doLogoutGlobal() {
    const client = getClient();
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) return showAuthMsg(error.message);
    applyUserUI(null);
    window.location.reload();
  }

  Object.assign(window, { openAuth, closeAuth, showAuthMsg, checkLoginGlobal, doLoginGlobal, doSignupGlobal, doLogoutGlobal });

  function initializeAuth() {
    placeAuthArea();
    const client = getClient();
    if (!client) return;
    checkLoginGlobal();
    client.auth.onAuthStateChange((_event, session) => {
      placeAuthArea();
      applyUserUI(session?.user || null);
    });
    document.getElementById("idxPass")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") doLoginGlobal();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeAuth, { once: true });
  } else {
    initializeAuth();
  }
})();
