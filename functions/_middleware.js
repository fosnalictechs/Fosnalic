// functions/_middleware.js
// Inject shared auth, privacy-preserving event tracking, and the admin-only stats view.
const PRIVATE_OR_UTILITY_PATHS = new Set([
  "/auth.html", "/dashboard.html", "/depot.html", "/my-files.html",
  "/phone.html", "/phone_sync.html", "/storage.html", "/tracker.html",
]);
const SUPABASE_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
const AUTH_LOADER = '<script src="/auth-global.js" defer></script>';
const TRACKED_PAGES = new Set([
  "/", "/index.html", "/extra-help.html", "/live-chat.html", "/services.html", "/contact.html",
]);

const AUTH_AREA = `<div id="authArea" style="display:inline-flex;gap:6px;align-items:center;flex-shrink:0;margin-left:auto;position:relative;z-index:20">
  <button id="loginBtn" type="button" onclick="openAuth()" style="background:#075E54;color:white;border:none;padding:6px 12px;border-radius:20px;font-weight:700;cursor:pointer;font-size:12px;white-space:nowrap">Log In</button>
  <div id="userArea" style="display:none;align-items:center;gap:6px"><span id="userName" style="font-weight:700;font-size:12px;max-width:100px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></span><button type="button" onclick="doLogoutGlobal()" style="background:#eee;color:#111;border:none;padding:5px 10px;border-radius:20px;cursor:pointer;font-size:11px;white-space:nowrap">Sign Out</button></div>
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

const TRACKING_SCRIPT = `<script>
window.addEventListener('DOMContentLoaded', () => {
  const client = window.supabaseClient;
  if (!client) return;
  function fosDeviceId() {
    let id = localStorage.getItem('fos_device_id');
    if (!id) {
      const random = (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID().replace(/-/g, '') : Math.random().toString(36).slice(2);
      id = 'dev_' + Date.now() + random;
      localStorage.setItem('fos_device_id', id);
    }
    return id;
  }
  async function trackVisit() {
    const deviceId = fosDeviceId();
    try {
      const { error } = await client.rpc('track_stat', {
        p_type: 'visit',
        p_page: location.pathname,
        p_email: null,
        p_name: null,
        p_device_id: deviceId,
        p_agent: navigator.userAgent
      });
      if (error) console.warn('Visit tracking failed:', error.message);
    } catch (error) { console.warn('Visit tracking failed:', error); }
  }
  async function trackLogin(email, name) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) return;
    try {
      const { error } = await client.rpc('track_stat', {
        p_type: 'login',
        p_page: location.pathname,
        p_email: normalizedEmail,
        p_name: name || '',
        p_device_id: fosDeviceId(),
        p_agent: navigator.userAgent
      });
      if (error) console.warn('Login tracking failed:', error.message);
    } catch (error) { console.warn('Login tracking failed:', error); }
  }
  window.fosDeviceId = fosDeviceId;
  window.trackVisit = trackVisit;
  window.trackLogin = trackLogin;
  trackVisit();
  client.auth.getSession().then(({data}) => { const user=data?.session?.user; if(user) trackLogin(user.email,user.user_metadata?.full_name || user.email?.split('@')[0]); });
  client.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user) trackLogin(session.user.email, session.user.user_metadata?.full_name || session.user.email?.split('@')[0]);
  });
});
</script>`;

const ADMIN_STATS = `<section id="siteStatsAdmin" style="max-width:1400px;margin:20px auto;padding:0 24px;font-family:'Segoe UI',system-ui,sans-serif;color:#1a365d">
  <div style="background:#fff;border:1px solid #E2E8F0;border-left:5px solid #FF6B35;border-radius:14px;padding:22px;box-shadow:0 4px 16px rgba(15,23,42,.06)">
    <h2 style="margin:0 0 14px;color:#2A4B7C">📊 Website Stats - Admin Only</h2>
    <div id="statsLoginPanel"><p style="margin:0 0 10px;color:#64748b">Sign in with the administrator account to view site statistics.</p>
      <form id="statsLoginForm" style="display:flex;gap:8px;flex-wrap:wrap;max-width:650px">
        <input id="statsAdminEmail" type="email" placeholder="Admin email" autocomplete="username" required style="flex:1;min-width:190px;padding:10px;border:1px solid #CBD5E1;border-radius:8px">
        <input id="statsAdminPassword" type="password" placeholder="Password" autocomplete="current-password" required style="flex:1;min-width:190px;padding:10px;border:1px solid #CBD5E1;border-radius:8px">
        <button type="submit" style="background:#2A4B7C;color:white;border:0;border-radius:8px;padding:10px 16px;font-weight:700">Admin Log In</button>
      </form><p id="statsAuthMessage" role="status" style="min-height:20px;margin:8px 0;color:#b91c1c"></p>
    </div>
    <div id="statsDenied" style="display:none;color:#b91c1c;font-weight:700">Access denied. This dashboard is restricted to the site administrator.</div>
    <div id="statsDashboard" style="display:none">
      <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin:8px 0 14px"><button id="statsRefresh" type="button" style="background:#2A4B7C;color:white;border:0;border-radius:8px;padding:8px 14px;font-weight:700">Refresh</button><button id="statsLogout" type="button" style="background:#eef2f7;color:#1a365d;border:1px solid #CBD5E1;border-radius:8px;padding:8px 14px;font-weight:700">Log Out</button></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px">
        <article style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px"><small>Total Unique Visits</small><strong id="statsVisits" style="display:block;font-size:1.8rem;color:#FF6B35">—</strong></article>
        <article style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px"><small>Total Unique Logins</small><strong id="statsLogins" style="display:block;font-size:1.8rem;color:#FF6B35">—</strong></article>
        <article style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px"><small>Visits Today</small><strong id="statsVisitsToday" style="display:block;font-size:1.8rem;color:#FF6B35">—</strong></article>
        <article style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px"><small>Logins Today</small><strong id="statsLoginsToday" style="display:block;font-size:1.8rem;color:#FF6B35">—</strong></article>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin-top:18px">
        <div><h3 style="margin:0 0 8px;color:#2A4B7C">Visits By First Page</h3><div style="overflow:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:8px;border-bottom:1px solid #E2E8F0">First page</th><th style="text-align:right;padding:8px;border-bottom:1px solid #E2E8F0">Unique devices</th></tr></thead><tbody id="statsPages"></tbody></table></div></div>
        <div><h3 style="margin:0 0 8px;color:#2A4B7C">Recent Logins</h3><div style="overflow:auto"><table style="width:100%;border-collapse:collapse;min-width:540px"><thead><tr><th style="text-align:left;padding:8px;border-bottom:1px solid #E2E8F0">Date/Time</th><th style="text-align:left;padding:8px;border-bottom:1px solid #E2E8F0">Name</th><th style="text-align:left;padding:8px;border-bottom:1px solid #E2E8F0">Email</th><th style="text-align:left;padding:8px;border-bottom:1px solid #E2E8F0">Page</th></tr></thead><tbody id="statsRecentLogins"></tbody></table></div></div>
      </div><p id="statsLoadMessage" role="status" style="margin:10px 0;color:#b91c1c"></p>
    </div>
  </div>
</section>
<script>
window.addEventListener('DOMContentLoaded', () => {
  const ADMIN = 'possyshad@gmail.com';
  const client = window.supabaseClient;
  const loginPanel = document.getElementById('statsLoginPanel');
  const dashboard = document.getElementById('statsDashboard');
  const denied = document.getElementById('statsDenied');
  const authMessage = document.getElementById('statsAuthMessage');
  const loadMessage = document.getElementById('statsLoadMessage');
  if (!client) { authMessage.textContent = 'Authentication service unavailable. Reload the page.'; return; }

  function setView(user) {
    loginPanel.style.display = user ? 'none' : 'block';
    dashboard.style.display = user && (user.email || '').toLowerCase() === ADMIN ? 'block' : 'none';
    denied.style.display = user && (user.email || '').toLowerCase() !== ADMIN ? 'block' : 'none';
    if (user && (user.email || '').toLowerCase() === ADMIN) loadStats();
  }
  function localDayStart() { const d = new Date(); d.setHours(0,0,0,0); return d; }
  function appendCell(row, value) { const cell=document.createElement('td'); cell.textContent=value == null ? '' : String(value); cell.style.cssText='padding:8px;border-bottom:1px solid #E2E8F0;white-space:nowrap'; row.appendChild(cell); }
  async function fetchAll(type) {
    const rows=[]; const batch=1000;
    for (let from=0; ; from+=batch) {
      const {data,error}=await client.from('site_stats').select('id,type,device_id,user_email,user_name,page,created_at').eq('type',type).order('created_at',{ascending:true}).range(from,from+batch-1);
      if(error) throw error;
      rows.push(...(data||[]));
      if(!data || data.length<batch) break;
    }
    return rows;
  }
  async function loadStats() {
    loadMessage.textContent='Loading statistics…';
    try {
      const [visits,logins]=await Promise.all([fetchAll('visit'),fetchAll('login')]);
      const uniqueDevices=new Set(visits.map(r=>r.device_id).filter(Boolean));
      const uniqueEmails=new Set(logins.map(r=>(r.user_email||'').toLowerCase()).filter(Boolean));
      const start=localDayStart();
      const visitsToday=visits.filter(r=>new Date(r.created_at)>=start);
      const loginsToday=logins.filter(r=>new Date(r.created_at)>=start);
      document.getElementById('statsVisits').textContent=uniqueDevices.size;
      document.getElementById('statsLogins').textContent=uniqueEmails.size;
      document.getElementById('statsVisitsToday').textContent=new Set(visitsToday.map(r=>r.device_id).filter(Boolean)).size;
      document.getElementById('statsLoginsToday').textContent=new Set(loginsToday.map(r=>(r.user_email||'').toLowerCase()).filter(Boolean)).size;

      const firstByDevice=new Map();
      visits.forEach(row=>{ if(row.device_id && !firstByDevice.has(row.device_id)) firstByDevice.set(row.device_id,row); });
      const pageCounts=new Map();
      firstByDevice.forEach(row=>{ const page=row.page||'(unknown)'; pageCounts.set(page,(pageCounts.get(page)||0)+1); });
      const pagesBody=document.getElementById('statsPages'); pagesBody.replaceChildren();
      [...pageCounts.entries()].sort((a,b)=>b[1]-a[1]).forEach(([page,count])=>{ const tr=document.createElement('tr'); appendCell(tr,page); const countCell=document.createElement('td'); countCell.textContent=count; countCell.style.cssText='padding:8px;border-bottom:1px solid #E2E8F0;text-align:right'; tr.appendChild(countCell); pagesBody.appendChild(tr); });

      const recentBody=document.getElementById('statsRecentLogins'); recentBody.replaceChildren();
      logins.slice().sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,20).forEach(row=>{
        const tr=document.createElement('tr');
        appendCell(tr,new Date(row.created_at).toLocaleString()); appendCell(tr,row.user_name); appendCell(tr,row.user_email); appendCell(tr,row.page);
        recentBody.appendChild(tr);
      });
      loadMessage.textContent='';
    } catch(error) {
      loadMessage.textContent='Could not load stats: '+(error.message||'Unknown error');
    }
  }

  document.getElementById('statsLoginForm').addEventListener('submit',async event=>{
    event.preventDefault(); authMessage.textContent='Signing in…';
    const email=document.getElementById('statsAdminEmail').value.trim();
    if(email.toLowerCase()!==ADMIN){ authMessage.textContent='Access denied. Use the site administrator account.'; return; }
    const {error}=await client.auth.signInWithPassword({email,password:document.getElementById('statsAdminPassword').value});
    if(error) { authMessage.textContent=error.message; return; }
    authMessage.textContent='';
    const {data}=await client.auth.getSession(); setView(data?.session?.user||null);
  });
  document.getElementById('statsRefresh').addEventListener('click',loadStats);
  document.getElementById('statsLogout').addEventListener('click',async()=>{ await client.auth.signOut(); setView(null); });
  client.auth.getSession().then(({data})=>setView(data?.session?.user||null));
  client.auth.onAuthStateChange((_event,session)=>setView(session?.user||null));
});
</script>`;

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname.toLowerCase();
  const response = await context.next();
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("text/html")) return response;

  const isPrivateUtility = PRIVATE_OR_UTILITY_PATHS.has(pathname);
  const isAdminPage = pathname === "/admin.html";
  const isLivePage = TRACKED_PAGES.has(pathname);
  const source = await response.clone().text();

  const hasHeaderNavbar = /<header[^>]*>[\s\S]*?class=["'][^"']*(?:navbar|container)/i.test(source);
  const hasHeader = /<header/i.test(source) || /class=["'][^"']*wa-top/i.test(source);
  const hasNav = /<nav/i.test(source);
  const hasAuthArea = /id=["']authArea["']/i.test(source);
  const hasAuthModal = /id=["']authModal["']/i.test(source);

  let rewriter = new HTMLRewriter();

  if (!isPrivateUtility) {
    rewriter = rewriter
      .on('script[src*="cdn.jsdelivr.net/npm/@supabase/supabase-js"]', { element(element) { element.remove(); } })
      .on('script[src*="auth-global.js"]', { element(element) { element.remove(); } })
      .on('script[src*="fosnalic-global-auth.js"]', { element(element) { element.remove(); } });
  }

  rewriter = rewriter
    .on("head", {
      element(element) {
        if (!isPrivateUtility) {
          element.append(`<script src="${SUPABASE_CDN}"></script>${AUTH_LOADER}`, { html: true });
        }
        if (isLivePage) {
          element.append('<script src="/fosnalic-remove-test-ad.js" defer></script>', { html: true });
        }
        element.append('<script src="/fosnalic-announcements.js" defer></script>', { html: true });
      },
    })
    .on("#authArea", {
      element(element) {
        element.setAttribute("style", "display:inline-flex;gap:6px;align-items:center;flex-shrink:0;margin-left:auto;position:relative;z-index:20");
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

  if (!isPrivateUtility && !hasAuthArea) {
    if (hasHeaderNavbar) {
      rewriter = rewriter.on("header .navbar, header .container", {
        element(element) { element.append(AUTH_AREA, { html: true }); },
      });
    } else if (hasHeader) {
      rewriter = rewriter.on("header, .wa-top", {
        element(element) { element.append(AUTH_AREA, { html: true }); },
      });
    } else if (hasNav) {
      rewriter = rewriter.on("nav", {
        element(element) { element.append(AUTH_AREA, { html: true }); },
      });
    } else {
      rewriter = rewriter.on("body", {
        element(element) {
          element.prepend(`<div style="display:flex;justify-content:flex-end;padding:8px;position:relative;z-index:20">${AUTH_AREA}</div>`, { html: true });
        },
      });
    }
  }

  if (!isPrivateUtility && !hasAuthModal) {
    rewriter = rewriter.on("body", {
      element(element) { element.append(AUTH_MODAL, { html: true }); },
    });
  }

  if (isAdminPage) {
    rewriter = rewriter.on("body", {
      element(element) { element.append(ADMIN_STATS, { html: true }); },
    });
  }

  if (isLivePage) {
    rewriter = rewriter.on("body", {
      element(element) { element.append(TRACKING_SCRIPT, { html: true }); },
    });
  }

  if (pathname === "/live-chat.html") {
    rewriter = rewriter.on("script:not([src])", {
      text(text) {
        const patched = text.text
          .replace(/^\s*const\s+SUPABASE_URL\s*=\s*["'][^"']+["'];\s*/gm, "")
          .replace(/^\s*const\s+SUPABASE_KEY\s*=\s*["'][^"']+["'];\s*/gm, "")
          .replace(/^\s*const\s+ADMIN_EMAIL\s*=\s*["'][^"']+["'];\s*/gm, "")
          .replace(
            /^\s*const\s+supabaseClient\s*=\s*supabase\.createClient\([^;]+;\s*/gm,
            'const supabaseClient = window.supabaseClient || (window.supabaseClient = supabase.createClient("https://lqqbvzttjstchkjfajwj.supabase.co", "sb_publishable_OD5wXFcYixFPoaQuRXcMoA_DIBcjRM7"));
'
          );
        if (patched !== text.text) text.replace(patched);
      },
    });
  }

  return rewriter.transform(response);
}
