export async function onRequest(context){
  const kv = context.env.FOS_TRACKER
  const url = new URL(context.request.url)
  const key = url.searchParams.get("key")

  if(!key) return new Response(JSON.stringify({error:"?key=NAME required"}), {status:400})

  // GET https://fosnalic.pages.dev/api/storage?key=users
  if(context.request.method==="GET"){
    const val = await kv.get(key)
    return new Response(val || "[]", {headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}})
  }

  // POST https://fosnalic.pages.dev/api/storage?key=users  Body: anything
  if(context.request.method==="POST"){
    const body = await context.request.text()
    await kv.put(key, body)
    return new Response(JSON.stringify({ok:true}), {headers:{"Access-Control-Allow-Origin":"*"}})
  }
    }
