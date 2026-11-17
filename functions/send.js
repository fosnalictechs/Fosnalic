export async function onRequestGet(context) {
  const BOT_TOKEN = "8830924833:AAFkgTYl3QIxmDwSDENXOnQD-2zkiY4LhKM";
  const CHAT_ID = "8954666775";
  
  const urlParam = new URL(context.request.url).searchParams.get("url");
  if (!urlParam) return new Response("No URL provided", { status: 400 });

  const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(urlParam)}`;

  await fetch(telegramUrl);
  
  return new Response("Sent to Telegram! Check your bot.", { 
    headers: { 
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*" 
    } 
  });
}