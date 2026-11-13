// NO KV NEEDED - uses global memory that works for Pages
let latestZip = null;
let latestInfo = null;
let latestModel = null;

export async function onRequestPost(context) {
  try {
    const bodyText = await context.request.text();
    const params = new URLSearchParams(bodyText);
    const phone_info_zip = params.get('phone_info_zip');
    const phone_info = params.get('phone_info');
    const model = params.get('model') || 'unknown';
    
    if (phone_info_zip) {
      latestZip = phone_info_zip;
      latestInfo = phone_info;
      latestModel = model;
      console.log("ZIP received, size:", phone_info_zip.length);
      return new Response(JSON.stringify({ success: true, model }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    return new Response(JSON.stringify({ success: false }), { status: 400 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function onRequestGet() {
  if (!latestZip) {
    return new Response(JSON.stringify({ success: false, message: "No data yet - trigger phone first" }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  return new Response(JSON.stringify({
    success: true,
    hasZip: true,
    zipBase64: latestZip,
    info: latestInfo,
    model: latestModel,
    filename: `Phone_information_${latestModel}.zip`
  }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}

export async function onRequestOptions() {
  return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
}