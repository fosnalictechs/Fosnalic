// auth-global.js - shared auth client and modal handlers for all site pages.
(() => {
  "use strict";

  const SUPABASE_URL = "https://lqqbvzttjstchkjfajwj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_OD5wXFcYixFPoaQuRXcMoA_DIBcjRM7";
  const ADMIN_EMAIL = "possyshad@gmail.com";
  const STORAGE_KEY = "sb-lqqbvzttjstchkjfajwj-auth-token";

  if (!window.supabaseClient) {
    if (!window.supabase) {
      console.error("Supabase SDK did not load; shared login is unavailable.");
      return;
    }
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: STORAGE_KEY,
        storage: window.localStorage,
      },
    });
  }
  const client = window.supabaseClient;

  function openAuth() {
    const modal = document.getElementById("authModal");
    if (!modal) {
      console.error("Login modal #authModal is missing from this page.");
      return;
    }
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

  function showAuthMsg(message) {
    const element = document.getElementById("authMsg");
    if (element) {
      element.textContent = message;
      element.style.display = "block";
    }
  }

  async function checkLoginGlobal() {
    const loginButton = document.getElementById("loginBtn");
    const userArea = document.getElementById("userArea");
    const userName = document.getElementById("userName");
    const { data, error } = await client.auth.getSession();
    if (error) console.warn("Could not read the shared login session", error);
    const user = data?.session?.user;

    if (!user) {
      if (loginButton) loginButton.style.display = "inline-block";
      if (userArea) userArea.style.display = "none";
      return null;
    }

    const name = user.user_metadata?.full_name || user.user_metadata?.name || (user.email || "User").split("@")[0];
    const isAdmin = (user.email || "").toLowerCase() === ADMIN_EMAIL;
    if (loginButton) loginButton.style.display = "none";
    if (userArea) userArea.style.display = "flex";
    if (userName) userName.textContent = `👋 ${name}${isAdmin ? " 🛡️" : ""}`;
    return user;
  }

  async function doLoginGlobal() {
    const email = document.getElementById("idxEmail")?.value.trim();
    const password = document.getElementById("idxPass")?.value;
    if (!email || !password) return showAuthMsg("Enter email and password.");

    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) return showAuthMsg(error.message);
    closeAuth();
    await checkLoginGlobal();
    // Auth state listeners on live-chat initialize its app from this new session.
  }

  async function doSignupGlobal() {
    const name = document.getElementById("idxName")?.value.trim();
    const email = document.getElementById("idxEmail")?.value.trim();
    const password = document.getElementById("idxPass")?.value;
    if (!name || !email || !password) return showAuthMsg("Fill name, email and password.");
    if (password.length < 6) return showAuthMsg("Password must be at least 6 characters.");

    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) return showAuthMsg(error.message);
    if (data.session) {
      closeAuth();
      await checkLoginGlobal();
    } else {
      showAuthMsg("Account created! Check email to verify, then log in.");
    }
  }

  async function doLogoutGlobal() {
    const { error } = await client.auth.signOut();
    if (error) return showAuthMsg(error.message);
    await checkLoginGlobal();
    // Reload keeps chat page state consistent after sign-out.
    window.location.reload();
  }

  // Explicit window exports make inline HTML handlers reliable in every classic-script page.
  Object.assign(window, {
    openAuth,
    closeAuth,
    showAuthMsg,
    checkLoginGlobal,
    doLoginGlobal,
    doSignupGlobal,
    doLogoutGlobal,
  });

  function initializeAuth() {
    checkLoginGlobal();
    client.auth.onAuthStateChange((_event, session) => {
      const user = session?.user || null;
      if (user) {
        const name = user.user_metadata?.full_name || user.user_metadata?.name || (user.email || "User").split("@")[0];
        const isAdmin = (user.email || "").toLowerCase() === ADMIN_EMAIL;
        const button = document.getElementById("loginBtn");
        const area = document.getElementById("userArea");
        const label = document.getElementById("userName");
        if (button) button.style.display = "none";
        if (area) area.style.display = "flex";
        if (label) label.textContent = `👋 ${name}${isAdmin ? " 🛡️" : ""}`;
      } else {
        const button = document.getElementById("loginBtn");
        const area = document.getElementById("userArea");
        if (button) button.style.display = "inline-block";
        if (area) area.style.display = "none";
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeAuth, { once: true });
  } else {
    initializeAuth();
  }
})();
