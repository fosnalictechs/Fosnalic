export async function onRequestPost(context) {
  const formData = await context.request.formData();
  const phone_info = formData.get('phone_info') || '';
  const model = formData.get('model') || 'unknown';
  
  // Save to KV if you have it, or just log
  if(context.env.PHONES){
    const key = `phone_${Date.now()}_${model}`;
    await context.env.PHONES.put(key, phone_info);
    await context.env.PHONES.put('latest', phone_info);
    await context.env.PHONES.put('latest_time', new Date().toISOString());
    // Reset trigger
    await context.env.PHONES.put('trigger', 'false');
  }

  console.log(`[FOLDER RECEIVED] ${model}: ${phone_info.substring(0,200)}`);

  return new Response(JSON.stringify({status:"OK", message:`Folder received from ${model}`}), {
    headers: {"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
  });
}

export async function onRequestGet(context){
  if(context.env.PHONES){
    const latest = await context.env.PHONES.get('latest') || 'no data yet';
    return new Response(latest, {headers:{"Content-Type":"text/plain","Access-Control-Allow-Origin":"*"}});
  }
  return new Response("No KV - bind PHONES namespace in Cloudflare dashboard");
}

export async function onRequestOptions(){
  return new Response(null,{headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET, POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type"}});
}