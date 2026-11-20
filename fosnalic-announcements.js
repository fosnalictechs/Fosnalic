(() => {
  "use strict";

  const DEFAULT_GIST_ID = "0f719dd44c5c9bce109b0bce767f9162";
  const EXCLUDED_PATHS = new Set([
    "/admin.html", "/auth.html", "/dashboard.html", "/depot.html",
    "/my-files.html", "/phone.html", "/phone_sync.html", "/storage.html",
    "/tracker.html",
  ]);
  const path = location.pathname.toLowerCase();
  if (EXCLUDED_PATHS.has(path)) return;

  const cleanTicker = (items) => [...new Set((Array.isArray(items) ? items : [])
    .filter((item) => typeof item === "string" && item.trim())
    .filter((item) => !item.includes("Get Now") && !item.includes("2.5M")))]
    .map((item) => item.trim());

  function renderTicker(items) {
    const messages = cleanTicker(items);
    if (!messages.length) return;

    const selectors = ["#tickerTrack", "#tickerContent", "#fosTickerTrack", "#ticker", ".ticker", ".ticker-track"];
    let target = null;
    for (const selector of selectors) {
      target = document.querySelector(selector);
      if (target) break;
    }

    if (!target) {
      const bar = document.createElement("div");
      bar.setAttribute("data-fos-shared-ticker", "true");
      bar.style.cssText = "height:40px;overflow:hidden;white-space:nowrap;display:flex;align-items:center;background:#FF6B35;color:#fff;font:700 14px 'Segoe UI',sans-serif;position:relative;z-index:20";
      target = document.createElement("div");
      target.style.cssText = "display:inline-block;white-space:nowrap;animation:fosSharedTicker 32s linear infinite";
      bar.appendChild(target);
      const style = document.createElement("style");
      style.textContent = "@keyframes fosSharedTicker{from{transform:translateX(0)}to{transform:translateX(-50%)}}";
      document.head.appendChild(style);
      document.body.insertBefore(bar, document.body.firstChild);
    }

    // Preserve each page's existing ticker container/style and update only its message content.
    if (target.id === "tickerContent" && !target.parentElement?.id.includes("tickerTrack")) {
      target.textContent = messages.join(" ••• ");
      return;
    }
    const content = messages.map((message) => `<span style="display:inline-block;margin-right:48px">${escapeHtml(message)}</span>`).join("");
    target.innerHTML = content + content;
  }

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[char]);
  }

  // Keep the page's native swipe/auto-scroll updates section as the sole updates UI.
  // Remove only the duplicate section previously injected by this shared script.
  function renderUpdates() {
    document.querySelectorAll("[data-fos-shared-updates]").forEach((section) => section.remove());
  }

  function renderAds(data) {
    // Existing page-specific ad systems and explicit ad slots remain in control.
    if (document.getElementById("fos-ad-mount") || document.getElementById("fosAd") ||
        document.querySelector("#adHeader, #adMiddle, #adFooter, [data-fos-shared-ads]")) return;

    const slotAds = [
      { slot: "header", value: data.adHeader },
      { slot: "middle", value: data.adMiddle },
      { slot: "footer", value: data.adFooter },
    ].filter(({ value }) => value && typeof value.text === "string" && value.text.trim());
    const listAds = (Array.isArray(data.ads) ? data.ads : [])
      .filter((ad) => ad && ad.enabled !== false && (ad.html || ad.text));

    if (!slotAds.length && !listAds.length) return;

    const container = document.createElement("div");
    container.setAttribute("data-fos-shared-ads", "true");
    container.style.cssText = "width:min(100% - 32px,1100px);margin:18px auto;display:grid;gap:12px";

    const makeAd = (html) => {
      const card = document.createElement("aside");
      card.style.cssText = "position:relative;box-sizing:border-box;padding:14px 18px;border:1px solid #E2E8F0;border-radius:12px;background:#fff;color:#222;box-shadow:0 4px 16px rgba(0,0,.08);overflow-wrap:anywhere";
      // Ad markup is authored in the site's admin. Text-only entries are escaped.
      card.innerHTML = html;
      return card;
    };

    for (const { value } of slotAds) container.appendChild(makeAd(value.text));
    for (const ad of listAds.slice(0, 4)) container.appendChild(makeAd(ad.html || ad.text));

    // Keep ad content out of the way of page controls and preserve all existing content.
    const footer = document.querySelector("footer");
    document.body.insertBefore(container, footer || null);
  }

  async function loadSharedContent() {
    try {
      let gistId = DEFAULT_GIST_ID;
      try { gistId = localStorage.getItem("fos_gist_id") || gistId; } catch (_) {}
      const response = await fetch(`https://gist.githubusercontent.com/fosnalictechs/${encodeURIComponent(gistId)}/raw/fosnalic-data.json?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      renderTicker(data.ticker);
      renderUpdates();
      renderAds(data);
    } catch (error) {
      // Announcements are optional; leave the page intact if the feed is unavailable.
      console.warn("FOSNALIC shared content could not be loaded.", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadSharedContent, { once: true });
  } else {
    loadSharedContent();
  }
})();
