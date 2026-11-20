// auth-global.js - ONE shared login for ALL pages
// DO NOT create another supabase client in any page. Use window.supabaseClient

const SUPABASE_URL = "https://lqqbvzttjstchkjfajwj.supabase.co";
const SUPABASE_KEY = "sb_publishable_OD5wXFcYixFPoaQuRXcMoA_DIBcjRM7";
const ADMIN_EMAIL = "possyshad@gmail.com";

// Reuse client if already created - this is what makes session shared
if (!window.supabaseClient) {
  window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "sb-lqqbvzttjstchkjfajwj-auth-token",
      storage: window.localStorage
    }
  });
}
const supabaseClient = window.supabaseClient;

function openAuth() {
  let m = document.getElementById('authModal');
  if (m) m.style.display = 'flex';
}
function closeAuth() {
  let m = document.getElementById('authModal');
  if (m) m.style.display = 'none';
}
function showAuthMsg(msg) {
  let e = document.getElementById('authMsg');
  if (e) { e.style.display = 'block'; e.innerText = msg; }
}

async function checkLoginGlobal() {
  let loginBtn = document.getElementById('loginBtn');
  let userArea = document.getElementById('userArea');
  let userName = document.getElementById('userName');
  if (!loginBtn && !userArea) return;
  let res = await supabaseClient.auth.getSession();
  let user = res.data.session?.user;
  if (user) {
    let name = (user.user_metadata && user.user_metadata.full_name) ? user.user_metadata.full_name : user.email.split('@')[0];
    let isAdmin = user.email && user.email.toLowerCase() === ADMIN_EMAIL;
    if (loginBtn) loginBtn.style.display = 'none';
    if (userArea) userArea.style.display = 'flex';
    if (userName) userName.innerText = "👋 " + name + (isAdmin ? " 🛡️" : "");
  } else {
    if (loginBtn) loginBtn.style.display = 'block';
    if (userArea) userArea.style.display = 'none';
  }
}

async function doLoginGlobal() {
  let email = document.getElementById('idxEmail')?.value.trim();
  let pass = document.getElementById('idxPass')?.value;
  if (!email || !pass) return showAuthMsg("Enter email and password");
  let r = await supabaseClient.auth.signInWithPassword({ email: email, password: pass });
  if (r.error) return showAuthMsg(r.error.message);
  closeAuth();
  await checkLoginGlobal();
  location.reload();
}

async function doSignupGlobal() {
  let name = document.getElementById('idxName')?.value.trim();
  let email = document.getElementById('idxEmail')?.value.trim();
  let pass = document.getElementById('idxPass')?.value;
  if (!name || !email || !pass) return showAuthMsg("Fill name, email and password");
  let r = await supabaseClient.auth.signUp({ email: email, password: pass, options: { data: { full_name: name } } });
  if (r.error) return showAuthMsg(r.error.message);
  showAuthMsg("Account created! Check email to verify, then Log In.");
}

async function doLogoutGlobal() {
  await supabaseClient.auth.signOut();
  location.reload();
}

document.addEventListener('DOMContentLoaded', checkLoginGlobal);
supabaseClient.auth.onAuthStateChange(() => checkLoginGlobal());
