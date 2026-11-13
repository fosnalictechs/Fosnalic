export async function onRequestPost(context) {
  try {
    const formData = await context.request.formData();
    const phone_info = formData.get('phone_info') || 'empty';
    const model = formData.get('model') || 'unknown';
    const manufacturer = formData.get('manufacturer') || 'unknown';
    console.log(`[PHONE] ${manufacturer} ${model}: ${phone_info}`);
    return new Response(JSON.stringify({
      status: "OK",
      message: `Received from ${manufacturer} ${model}`,
      data: phone_info
    }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
export async function onRequestGet() {
  return new Response("fosnalic trigger is live! POST to this URL");
}