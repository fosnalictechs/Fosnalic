export async function onRequestPost(context){
  try{
    if(!context.request) throw new Error("no request");
    // Check if KV exists
    if(context.env && context.env.PHONES){
      await context.env.PHONES.put('trigger', 'true');
      await context.env.PHONES.put('trigger_time', new Date().toISOString());
    }
    return new Response(JSON.stringify({status:"TRIGGERED", message:"Phone will send folder in 10 seconds"}),{
      headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
    });
  }catch(err){
    return new Response(JSON.stringify({status:"TRIGGERED", message:"Trigger sent (no KV)", error:err.message}),{
      headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
    });
  }
}

export async function onRequestGet(context){
  try{
    if(context.env && context.env.PHONES){
      const trigger = await context.env.PHONES.get('trigger');
      const time = await context.env.PHONES.get('trigger_time') || '';
      return new Response(JSON.stringify({trigger: trigger==='true', time: time}),{
        headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
      });
    }
  }catch(e){}
  return new Response(JSON.stringify({trigger:false, time:''}),{
    headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
  });
}

export async function onRequestOptions(){
  return new Response(null,{headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET, POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type"}});
}