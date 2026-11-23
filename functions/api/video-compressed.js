export async function onRequestPost(context) {
  try {
    const payload = await context.request.json();
    console.log("Video resent event received:", payload);
    return new Response(
      JSON.stringify({
        ok: true,
        receivedAt: new Date().toISOString(),
        fileName: payload.fileName || "unknown",
        newSizeMB: payload.newSizeMB || 0,
        originalSizeMB: payload.originalSizeMB || 0,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: "Invalid JSON payload" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}