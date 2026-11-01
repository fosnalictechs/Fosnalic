export async function onRequest(context) {
  const kv = context.env.TRACK_KV;
  const cors = {
    "Access-Control-Allow-Origin":"*",
    "Access-Control-Allow-Methods":"GET,POST,OPTIONS",
    "Access-Control-Allow-Headers":"Content-Type"
  };
  if (context.request.method === "OPTIONS") return new Response("", {headers:cors});
  if (context.request.method === "GET") {
    const list = await kv.get("locations","json") || [];
    return new Response(JSON.stringify(list), {headers:{...cors,"Content-Type":"application/json"}});
  }
  if (context.request.method === "POST") {
    const data = await context.request.json();
    let list = await kv.get("locations","json") || [];
    list = list.filter(d => d.id !== data.id);
    data.time = Date.now();
    list.push(data);
    await kv.put("locations", JSON.stringify(list));
    return new Response(JSON.stringify(list), {headers:cors});
  }
  return new Response("[]", {headers:cors});
}
