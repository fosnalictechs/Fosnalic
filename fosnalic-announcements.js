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

  function renderUpdates(news) {
    if (!Array.isArray(news) || !news.length) return;
    let track = document.getElementById("newsTrack");
    if (!track) {
      const section = document.createElement("section");
      section.setAttribute("data-fos-shared-updates", "true");
      section.style.cssText = "padding:36px 0;background:#F5F7FA;color:#111;overflow:hidden";
      section.innerHTML = '<div style="width:90%;max-width:1100px;margin:auto"><h2 style="margin-bottom:18px">Latest Updates</h2><div data-fos-update-track style="display:flex;gap:16px;overflow-x:auto;padding-bottom:12px"></div></div>';
      const footer = document.querySelector("footer");
      document.body.insertBefore(section, footer || null);
      track = section.querySelector("[data-fos-update-track]");
    }

    track.replaceChildren(...news.map((item) => {
      const card = document.createElement("article");
      card.style.cssText = "box-sizing:border-box;flex:0 0 280px;background:#fff;border-radius:12px;box-shadow:0 6px 20px rgba(0,0,0,.08);overflow:hidden;color:#111";
      if (item && item.img) {
        const image = document.createElement("img");
        image.src = item.img;
        image.alt = item.title || "FOSNALIC Techs update";
        image.loading = "lazy";
        image.style.cssText = "width:100%;height:150px;object-fit:cover;display:block";
        card.appendChild(image);
      }
      const body = document.createElement("div");
      body.style.cssText = "padding:14px";
      const title = document.createElement("h3");
      title.textContent = item?.title || "Update";
      title.style.cssText = "font-size:1rem;margin:0 0 8px";
      const description = document.createElement("p");
      description.textContent = item?.desc || "";
      description.style.cssText = "font-size:.9rem;color:#4a5568;margin:0";
      body.append(title, description);
      card.appendChild(body);
      return card;
    }));
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
      card.style.cssText = "position:relative;box-sizing:border-box;padding:14px 18px;border:1px solid #E2E8F0;border-radius:12px;background:#fff;color:#222;box-shadow:0 4px 16px rgba(0,0,0,.08);overflow-wrap:anywhere";
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
      renderUpdates(data.news);
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
