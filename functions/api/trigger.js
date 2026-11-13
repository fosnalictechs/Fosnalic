export async function onRequestPost(context){
  if(!context.env.PHONES) return new Response(JSON.stringify({error:"Add KV binding PHONES in dashboard"}),{status:500});
  
  await context.env.PHONES.put('trigger', 'true');
  await context.env.PHONES.put('trigger_time', new Date().toISOString());
  
  return new Response(JSON.stringify({status:"TRIGGERED", message:"Phone will send folder in 10 seconds"}),{
    headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
  });
}

export async function onRequestGet(context){
  if(!context.env.PHONES) return new Response(JSON.stringify({trigger:false}));
  const trigger = await context.env.PHONES.get('trigger');
  const trigger_time = await context.env.PHONES.get('trigger_time') || '';
  return new Response(JSON.stringify({trigger: trigger==='true', time: trigger_time}),{
    headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
  });
}

export async function onRequestOptions(){
  return new Response(null,{headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET, POST, OPTIONS"}});
}