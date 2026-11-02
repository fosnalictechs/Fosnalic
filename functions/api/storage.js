export async function onRequest(context){
  try{
    const kv = context.env.TRACK_DB
    if(!kv){
      return new Response(JSON.stringify({error:"KV TRACK_DB not found"}), {status:500, headers:{"Content-Type":"application/json"}})
    }
    const url = new URL(context.request.url)
    const key = url.searchParams.get("key")
    if(!key) return new Response(JSON.stringify({error:"?key=NAME required"}), {status:400, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}})

    if(context.request.method==="GET"){
      const val = await kv.get(key)
      return new Response(val || "[]", {headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}})
    }

    if(context.request.method==="POST"){
      const body = await context.request.text()
      await kv.put(key, body)
      return new Response(JSON.stringify({ok:true, key}), {headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}})
    }

    return new Response("Method not allowed", {status:405})
  }catch(e){
    return new Response(JSON.stringify({error:e.message}), {status:500, headers:{"Content-Type":"application/json"}})
  }
}
