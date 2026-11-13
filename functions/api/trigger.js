const STORE = "https://api.npoint.io/1a2b3c4d5e6f7g8h9i0j1"; // we will use kvdb

export async function onRequestPost() {
  try {
    await fetch("https://kvdb.io/YourBucket123/trigger", { method: "POST", body: "true" });
  } catch(e) {
    // fallback to global
  }
  // Also store in Pages global for quick check
  globalThis._trigger = { trigger: true, time: Date.now() };
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
}

export async function onRequestGet() {
  if (globalThis._trigger && globalThis._trigger.trigger) {
    const age = Date.now() - globalThis._trigger.time;
    if (age < 40000) {
      const r = { trigger: true, time: globalThis._trigger.time };
      globalThis._trigger = { trigger: false };
      return new Response(JSON.stringify(r), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
    }
  }
  return new Response(JSON.stringify({ trigger: false }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
}