let LOCATIONS = []; // in memory (use KV for permanent later)

export async function onRequest(context) {
  const { request } = context;
  
  if (request.method === "OPTIONS") {
    return new Response("", { headers: cors() });
  }

  if (request.method === "GET") {
    return new Response(JSON.stringify(LOCATIONS), { headers: { ...cors(), "Content-Type":"application/json" } });
  }

  if (request.method === "POST") {
    const data = await request.json(); // {id, lat, lng}
    // remove old same id
    LOCATIONS = LOCATIONS.filter(d => d.id !== data.id);
    LOCATIONS.push(data);
    return new Response(JSON.stringify(LOCATIONS), { headers: cors() });
  }

  return new Response("Use GET or POST");
}

function cors(){
  return {
    "Access-Control-Allow-Origin":"*",
    "Access-Control-Allow-Methods":"GET,POST,OPTIONS",
    "Access-Control-Allow-Headers":"Content-Type"
  }
  }
