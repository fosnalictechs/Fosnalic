export async function onRequestGet(context) {
    try {
        let zipBase64 = null, model = 'phone';
        if (context.env?.PHONE_STORE) {
            zipBase64 = await context.env.PHONE_STORE.get('latest_zip');
            model = await context.env.PHONE_STORE.get('latest_model') || 'phone';
        }
        if (!zipBase64) return new Response("No ZIP found", { status: 404 });
        const zipBuffer = Uint8Array.from(atob(zipBase64), c => c.charCodeAt(0));
        return new Response(zipBuffer, { headers: { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="Phone_information_${model}.zip"`, 'Access-Control-Allow-Origin': '*' } });
    } catch (e) { return new Response("Error: " + e.message, { status: 500 }); }
}