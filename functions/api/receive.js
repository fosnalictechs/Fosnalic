export async function onRequestPost(context) {
  const text = await context.request.text();
  const p = new URLSearchParams(text);
  const zip = p.get("phone_info_zip");
  const info = p.get("phone_info");
  const model = p.get("model") || "phone";
  if (!zip) return new Response(JSON.stringify({ success: false }), { status: 400 });
  const KV = context.env.PHONES || context.env.PHONE_STORE;
  if (KV) {
    await KV.put("latest_zip", zip);
    await KV.put("latest_info", info || "");
    await KV.put("latest_model", model);
  }
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
export async function onRequestGet(context) {
  const KV = context.env.PHONES || context.env.PHONE_STORE;
  if (KV) {
    const zip = await KV.get("latest_zip");
    if (zip) {
      const info = await KV.get("latest_info");
      const model = await KV.get("latest_model");
      return new Response(JSON.stringify({ success: true, hasZip: true, zipBase64: zip, info, model, filename: `Phone_information_${model}.zip` }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
  }
  return new Response(JSON.stringify({ success: false, message: "No data" }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
export async function onRequestOptions() {
  return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}