export async function onRequestGet(context) {
  const BOT_TOKEN = "8830924833:AAFkgTYl3QIxmDwSDENXOnQD-2zkiY4LhKM"; // <-- replace with your BotFather token
  const CHAT_ID = "8954666775"; // <-- replace with the ID userinfobot gave you
  
  const urlParam = new URL(context.request.url).searchParams.get("url");
  if (!urlParam) return new Response("No URL provided");

  const telegramUrl = https://api.telegram.org/bot${BOT_TOKEN}/sendVideo?chat_id=${CHAT_ID}&video=${encodeURIComponent(urlParam)};

  const tg = await fetch(telegramUrl);
  const data = await tg.text();
  
  return new Response("Sent to Telegram! Check your bot.", { 
    headers: { "Access-Control-Allow-Origin": "*" } 
  });
}