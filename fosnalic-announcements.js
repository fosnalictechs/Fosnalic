(() => {
  "use strict";

  const DEFAULT_GIST_ID = "0f719dd44c5c9bce109b0bce767f9162";

  const cleanTicker = (items) => [...new Set((Array.isArray(items) ? items : [])
    .filter((item) => typeof item === "string" && item.trim())
    .filter((item) => !/test\s*popup|get\s*now|2\.5m/i.test(item)))]
    .map((item) => item.trim());

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[char]);
  }

  function sanitizeUrl(u) {
    if (!u || typeof u !== "string") return "";
    u = u.trim();
    if (/^https?:\/\//i.test(u) || u.startsWith("/")) return u;
    return "";
  }

  function buildAdMarkup(adObj) {
    if (!adObj || typeof adObj !== "object") return "";
    const imgUrl = sanitizeUrl(adObj.img || adObj.image || adObj.imageUrl || adObj.bannerUrl || "");
    const linkUrl = sanitizeUrl(adObj.url || adObj.link || adObj.href || adObj.clickUrl || "");
    const title = typeof adObj.title === "string" ? adObj.title.trim() : "";
    const rawText = typeof adObj.text === "string" ? adObj.text.trim() : "";
    const rawHtml = typeof adObj.html === "string" ? adObj.html.trim() : "";

    if (/test\s*popup|ads\s+system\s+is\s+working/i.test(rawText + rawHtml)) return "";
    if (/<(img|a|div|p|span)[\s>]/i.test(rawText)) return rawText;
    if (/<(img|a|div|p|span)[\s>]/i.test(rawHtml)) return rawHtml;

    if (!imgUrl && /^https?:\/\/.*\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(rawText)) {
      return `<img src="${escapeHtml(rawText)}" onerror="this.style.display='none'" style="max-width:100%;max-height:260px;border-radius:8px;display:block;margin:0 auto;">`;
    }

    let html = "";
    if (imgUrl) {
      const imgTag = `<img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(title || "Advertisement")}" loading="lazy" onerror="this.style.display='none'" style="max-width:100%;max-height:260px;width:auto;height:auto;border-radius:8px;display:block;object-fit:contain;margin:0 auto 10px;">`;
      html += linkUrl
        ? `<a href="${escapeHtml(linkUrl)}" target="_blank" rel="noopener noreferrer" style="display:block;">${imgTag}</a>`
        : imgTag;
    }
    if (title) html += `<div style="font-weight:700;font-size:15px;margin-bottom:6px;color:#0f172a;">${escapeHtml(title)}</div>`;
    if (rawText) html += `<div style="font-size:14px;line-height:1.5;color:#1e293b;white-space:pre-line;">${escapeHtml(rawText)}</div>`;
    if (!html && rawHtml) html = rawHtml;
    return html;
  }

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
      bar.style.cssText = "height:38px;overflow:hidden;white-space:nowrap;display:flex;align-items:center;background:#FF6B35;color:#fff;font:700 13px 'Segoe UI',sans-serif;position:relative;z-index:20;width:100%";
      target = document.createElement("div");
      target.style.cssText = "display:inline-block;white-space:nowrap;animation:fosSharedTicker 32s linear infinite";
      bar.appendChild(target);
      const style = document.createElement("style");
      style.textContent = "@keyframes fosSharedTicker{from{transform:translateX(0)}to{transform:translateX(-50%)}}";
      document.head.appendChild(style);
      document.body.insertBefore(bar, document.body.firstChild);
    }
    if (target.id === "tickerContent" && !target.parentElement?.id.includes("tickerTrack")) {
      target.textContent = messages.join(" ••• ");
      return;
    }
    const content = messages.map((m) => `<span style="display:inline-block;margin-right:48px">${escapeHtml(m)}</span>`).join("");
    target.innerHTML = content + content;
  }

  function renderAds(data) {
    const hasContent = (v) => v && typeof v === "object" && (
      (typeof v.text === "string" && v.text.trim()) ||
      (typeof v.html === "string" && v.html.trim()) ||
      v.img || v.image || v.imageUrl || v.bannerUrl
    );

    const slotMap = [
      { id: "adHeaderContent", box: "adHeader", val: data.adHeader },
      { id: "adMiddleContent", box: "adMiddle", val: data.adMiddle },
      { id: "adFooterContent", box: "adFooter", val: data.adFooter },
    ];

    const listAds = (Array.isArray(data.ads) ? data.ads : [])
      .filter((ad) => ad && ad.enabled !== false && hasContent(ad));

    let listIdx = 0;
    for (const slot of slotMap) {
      const target = document.getElementById(slot.id) || document.getElementById(slot.box);
      const source = hasContent(slot.val) ? slot.val : listAds[listIdx++];
      if (target && source && !target.innerHTML.trim()) {
        const markup = buildAdMarkup(source);
        if (markup) {
          target.innerHTML = markup;
          const parentBox = document.getElementById(slot.box);
          if (parentBox) parentBox.style.display = "block";
        }
      }
    }

    const remaining = listAds.slice(listIdx);
    if (!remaining.length || document.querySelector("[data-fos-shared-ads]")) return;

    const container = document.createElement("div");
    container.setAttribute("data-fos-shared-ads", "true");
    container.style.cssText = "width:min(100% - 32px,1100px);margin:18px auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;position:relative;z-index:1;clear:both";

    for (const ad of remaining.slice(0, 4)) {
      const markup = buildAdMarkup(ad);
      if (!markup) continue;
      const card = document.createElement("aside");
      card.style.cssText = "position:relative;box-sizing:border-box;padding:14px 18px;border:1px solid #E2E8F0;border-radius:12px;background:#fff;color:#222;box-shadow:0 4px 16px rgba(0,0,0,.08);overflow-wrap:anywhere";
      card.innerHTML = markup;
      container.appendChild(card);
    }

    if (container.children.length) {
      const footer = document.querySelector("footer");
      document.body.insertBefore(container, footer || null);
    }
  }

  async function loadSharedContent() {
    try {
      let gistId = DEFAULT_GIST_ID;
      try { gistId = localStorage.getItem("fos_gist_id") || gistId; } catch (_) {}
      const response = await fetch(`https://gist.githubusercontent.com/fosnalictechs/${encodeURIComponent(gistId)}/raw/fosnalic-data.json?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      renderTicker(data.ticker);
      renderAds(data);
    } catch (error) {
      console.warn("FOSNALIC shared content could not be loaded.", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadSharedContent, { once: true });
  } else {
    loadSharedContent();
  }
})();
