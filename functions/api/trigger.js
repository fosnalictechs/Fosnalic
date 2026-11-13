export async function onRequestPost(context) {
  const data = { trigger: true, time: Date.now() };
  const KV = context.env.PHONES || context.env.PHONE_STORE;
  if (KV) await KV.put("trigger", JSON.stringify(data), { expirationTtl: 60 });
  return new Response(JSON.stringify({ success: true, trigger: true }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
export async function onRequestGet(context) {
  try {
    const KV = context.env.PHONES || context.env.PHONE_STORE;
    if (KV) {
      const val = await KV.get("trigger");
      if (val) {
        const parsed = JSON.parse(val);
        if (Date.now() - parsed.time < 40000) {
          await KV.delete("trigger");
          return new Response(JSON.stringify({ trigger: true }), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        } else {
          await KV.delete("trigger");
        }
      }
    }
  } catch(e) {}
  return new Response(JSON.stringify({ trigger: false }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
export async function onRequestOptions() {
  return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" } });
}