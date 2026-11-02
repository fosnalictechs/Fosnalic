export async function onRequest(context) {
  const kv = context.env.TRACK_KV;
  const cors = {
    "Access-Control-Allow-Origin":"*",
    "Access-Control-Allow-Methods":"GET,POST,OPTIONS",
    "Access-Control-Allow-Headers":"Content-Type"
  };
  if (context.request.method === "OPTIONS") return new Response("", {headers:cors});
  
  try{
    const url = new URL(context.request.url)
    const key = url.searchParams.get("key")
    if(!key) return new Response(JSON.stringify({error:"?key=NAME required"}), {status:400, headers:cors});

    if(context.request.method==="GET"){
      const val = await kv.get(key)
      return new Response(val || "[]", {headers:{...cors,"Content-Type":"application/json"}});
    }
    if(context.request.method==="POST"){
      const body = await context.request.text()
      await kv.put(key, body)
      return new Response(JSON.stringify({ok:true, key}), {headers:cors});
    }
    return new Response("Method not allowed", {status:405, headers:cors});
  }catch(e){
    return new Response(JSON.stringify({error:e.message}), {status:500, headers:{...cors,"Content-Type":"application/json"}});
  }
}
