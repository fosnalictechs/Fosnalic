(() => {
  "use strict";

  const TEST_AD = /test\s*popup|your\s+ads\s+system\s+is\s+working|ads\s+system\s+is\s+working/i;
  const AD_CONTAINER = 'aside, [role="dialog"], [class*="ad" i], [id*="ad" i], [class*="popup" i], [id*="popup" i]';

  function removeTestAdContent(root = document.body) {
    if (!root) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    for (const node of nodes) {
      if (!TEST_AD.test(node.nodeValue || "")) continue;
      const container = node.parentElement?.closest(AD_CONTAINER);
      if (container) container.remove();
      else node.remove();
    }

    // Also catch messages split across HTML elements, as in formatted ad markup.
    const elements = root.querySelectorAll ? [...root.querySelectorAll("*")] : [];
    for (const element of elements.reverse()) {
      if (!element.isConnected || !TEST_AD.test(element.textContent || "")) continue;
      const childHasMessage = [...element.children].some((child) => TEST_AD.test(child.textContent || ""));
      if (childHasMessage) continue;
      const container = element.matches(AD_CONTAINER) ? element : element.closest(AD_CONTAINER);
      if (container) container.remove();
      else element.remove();
    }
  }

  function start() {
    removeTestAdContent();
    if (!document.body) return;
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "characterData") {
          const node = record.target;
          if (TEST_AD.test(node.nodeValue || "")) {
            const container = node.parentElement?.closest(AD_CONTAINER);
            if (container) container.remove();
            else node.remove();
          }
        } else {
          for (const node of record.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) removeTestAdContent(node);
            else if (node.nodeType === Node.TEXT_NODE && TEST_AD.test(node.nodeValue || "")) node.remove();
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
