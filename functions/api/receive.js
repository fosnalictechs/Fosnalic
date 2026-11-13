let latestData = null;
export async function onRequestPost(context) {
    try {
        const bodyText = await context.request.text();
        const params = new URLSearchParams(bodyText);
        const phone_info = params.get('phone_info');
        const phone_info_zip = params.get('phone_info_zip');
        const is_zip = params.get('is_zip');
        const model = params.get('model') || 'unknown';
        if (phone_info_zip && is_zip === 'true') {
            latestData = { zip: phone_info_zip, info: phone_info, model, time: new Date().toISOString(), isZip: true };
            if (context.env?.PHONE_STORE) {
                await context.env.PHONE_STORE.put('latest_zip', phone_info_zip);
                await context.env.PHONE_STORE.put('latest_info', phone_info);
                await context.env.PHONE_STORE.put('latest_model', model);
            }
            return new Response(JSON.stringify({ success: true, message: "ZIP Folder received", model, isZip: true }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
        }
        return new Response(JSON.stringify({ success: false }), { status: 400 });
    } catch (e) { return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500 }); }
}
export async function onRequestGet(context) {
    let zipData = null, info = null, model = 'unknown';
    if (context.env?.PHONE_STORE) {
        zipData = await context.env.PHONE_STORE.get('latest_zip');
        info = await context.env.PHONE_STORE.get('latest_info');
        model = await context.env.PHONE_STORE.get('latest_model') || 'unknown';
    } else if (latestData) { zipData = latestData.zip; info = latestData.info; model = latestData.model; }
    if (!zipData && !info) return new Response(JSON.stringify({ success: false, message: "No data" }), { headers: { 'Content-Type': 'application/json' } });
    return new Response(JSON.stringify({ success: true, hasZip: !!zipData, zipBase64: zipData, info, model, filename: `Phone_information_${model}_${Date.now()}.zip` }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
}
export async function onRequestOptions() { return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } }); }