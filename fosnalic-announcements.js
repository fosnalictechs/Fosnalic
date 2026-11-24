//file fosnalic-announcements.js
(() => {
  "use strict";

  const DEFAULT_GIST_ID = "0f719dd44c5c9bce109b0bce767f9162";

  // >>> YOU DECIDE HERE <<<
  // ONLY these pages get ads. No other page gets ads.
  const ALLOWED_AD_PAGES = new Set([
    "/",
    "/index.html",
    "/services.html",
    "/extra-help.html",
  ]);

  const path = location.pathname.toLowerCase();

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
    if (target.id === "tickerContent" && !target.parentElement?.id.includes("tickerTrack")) {
      target.textContent = messages.join(" ••• ");
      return;
    }
    const content = messages.map((message) => `<span style="display:inline-block;margin-right:48px">${escapeHtml(message)}</span>`).join("");
    target.innerHTML = content + content;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[char]);
  }

  function sanitizeUrl(url) {
    if (typeof url !== "string") return "";
    const trimmed = url.trim();
    if (!trimmed) return "";
    if (/^(https?:\/\/|\/|\.\/|\.\.\/|data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,)/i.test(trimmed)) {
      return trimmed;
    }
    return "";
  }

  // FIXED: now shows pictures from img, from image URL in text, and from <img> HTML in text
  function buildAdMarkup(adObj) {
    if (!adObj || typeof adObj !== "object") return "";
    const imgUrl = sanitizeUrl(adObj.img || adObj.image || adObj.imageUrl || adObj.bannerUrl || "");
    const linkUrl = sanitizeUrl(adObj.url || adObj.link || adObj.href || adObj.clickUrl || "");
    const title = typeof adObj.title === "string" ? adObj.title.trim() : "";
    const rawText = typeof adObj.text === "string" ? adObj.text.trim() : "";
    const rawHtml = typeof adObj.html === "string" ? adObj.html.trim() : "";

    let finalImg = imgUrl;
    let finalText = rawText;
    if (!finalImg && /^https?:\/\/.*\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(rawText)) {
      finalImg = sanitizeUrl(rawText);
      finalText = "";
    }
    if (!finalImg && /<img[\s>]/i.test(rawText)) {
      return rawText;
    }

    if (finalImg) {
      const safeImg = escapeHtml(finalImg);
      const safeAlt = escapeHtml(title || "Advertisement");
      const imgTag = `<img src="${safeImg}" alt="${safeAlt}" loading="lazy" style="max-width:100%;max-height:260px;width:auto;height:auto;border-radius:8px;display:block;object-fit:contain;margin:0 auto 10px;">`;
      const wrappedImg = linkUrl
        ? `<a href="${escapeHtml(linkUrl)}" target="_blank" rel="noopener noreferrer" style="display:block;text-decoration:none;">${imgTag}</a>`
        : imgTag;
      const bodyContent = rawHtml || (finalText ? `<div style="font-size:14px;line-height:1.5;">${escapeHtml(finalText)}</div>` : "");
      const titleHtml = title ? `<div style="font-weight:700;font-size:15px;margin-bottom:6px;">${escapeHtml(title)}</div>` : "";
      const ctaHtml = linkUrl
        ? `<div style="margin-top:8px;"><a href="${escapeHtml(linkUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:6px 12px;border-radius:6px;background:#2563EB;color:#fff;font-size:12px;font-weight:600;text-decoration:none;">Learn More</a></div>`
        : "";
      return `${wrappedImg}${titleHtml}${bodyContent}${ctaHtml}`;
    }
    return rawHtml || rawText || "";
  }

  function renderUpdates() {
    document.querySelectorAll("[data-fos-shared-updates]").forEach((section) => section.remove());
  }

  function renderAds(data) {
    if (!ALLOWED_AD_PAGES.has(path)) return;
    // FIXED: don't block just because page has #adHeader divs
    if (document.getElementById("fos-ad-mount") || document.getElementById("fosAd") ||
        document.querySelector("[data-fos-shared-ads]")) return;

    const hasAdContent = (value) => {
      if (!value || typeof value !== "object") return false;
      return Boolean(
        (typeof value.text === "string" && value.text.trim()) ||
        (typeof value.html === "string" && value.html.trim()) ||
        (typeof value.img === "string" && value.img.trim()) ||
        (typeof value.image === "string" && value.image.trim()) ||
        (typeof value.imageUrl === "string" && value.imageUrl.trim()) ||
        (typeof value.bannerUrl === "string" && value.bannerUrl.trim())
      );
    };

    const slotAds = [
      { slot: "header", value: data.adHeader },
      { slot: "middle", value: data.adMiddle },
      { slot: "footer", value: data.adFooter },
    ].filter(({ value }) => hasAdContent(value));

    const listAds = (Array.isArray(data.ads) ? data.ads : [])
      .filter((ad) => ad && ad.enabled !== false && hasAdContent(ad));

    if (!slotAds.length && !listAds.length) return;

    const container = document.createElement("div");
    container.setAttribute("data-fos-shared-ads", "true");
    container.style.cssText = "width:min(100% - 32px,1100px);margin:18px auto;display:grid;gap:12px;position:relative;z-index:1;clear:both";

    const makeAd = (html) => {
      const card = document.createElement("aside");
      card.style.cssText = "position:relative;box-sizing:border-box;padding:14px 18px;border:1px solid #E2E8F0;border-radius:12px;background:#fff;color:#222;box-shadow:0 4px 16px rgba(0,0,0,.08);overflow-wrap:anywhere";
      card.innerHTML = html;
      return card;
    };

    for (const { value } of slotAds) {
      const markup = buildAdMarkup(value);
      if (markup) container.appendChild(makeAd(markup));
    }
    for (const ad of listAds.slice(0, 4)) {
      const markup = buildAdMarkup(ad);
      if (markup) container.appendChild(makeAd(markup));
    }

    if (!container.children.length) return;
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
      console.warn("FOSNALIC shared content could not be loaded.", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadSharedContent, { once: true });
  } else {
    loadSharedContent();
  }
})();