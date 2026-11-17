// Add the shared announcements loader to public HTML responses without editing page markup.
const PRIVATE_OR_UTILITY_PATHS = new Set([
  "/admin.html",
  "/auth.html",
  "/dashboard.html",
  "/depot.html",
  "/my-files.html",
  "/phone.html",
  "/phone_sync.html",
  "/storage.html",
  "/tracker.html",
]);

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname.toLowerCase();

  if (PRIVATE_OR_UTILITY_PATHS.has(pathname)) {
    return context.next();
  }

  const response = await context.next();
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("text/html")) {
    return response;
  }

  return new HTMLRewriter()
    .on("head", {
      element(element) {
        element.append('<script src="/fosnalic-announcements.js" defer></script>', {
          html: true,
        });
      },
    })
    .transform(response);
}
