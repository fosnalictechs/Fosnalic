export async function onRequest(context) {
  const { request, env } = context;
  const kv = env.TRACK_KV || env.TRACK_DB;

  if (request.method === "POST") {
    const body = await request.json(); // {id: "FOS-2702", action: "track"}
    await kv.put(`cmd_${body.id}`, JSON.stringify({action: body.action, time: Date.now()}));
    return new Response(JSON.stringify({ok:true}), {headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
  }
  if (request.method === "GET") {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const cmd = await kv.get(`cmd_${id}`);
    if (cmd) await kv.delete(`cmd_${id}`); // one-time trigger
    return new Response(cmd || "{}", {headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
  }
  return new Response("ok", {headers:{"Access-Control-Allow-Origin":"*"}});
}
