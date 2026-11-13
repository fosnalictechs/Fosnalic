let triggerState = { trigger: false, time: null };
export async function onRequestPost(context) {
    triggerState = { trigger: true, time: Date.now() };
    if (context.env?.PHONE_STORE) await context.env.PHONE_STORE.put('trigger_state', JSON.stringify(triggerState));
    return new Response(JSON.stringify({ success: true, trigger: true }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
}
export async function onRequestGet(context) {
    let state = triggerState;
    if (context.env?.PHONE_STORE) {
        const saved = await context.env.PHONE_STORE.get('trigger_state');
        if (saved) state = JSON.parse(saved);
    }
    const isExpired = state.time && (Date.now() - state.time > 30000);
    if (isExpired) { state = { trigger: false }; triggerState = state; if (context.env?.PHONE_STORE) await context.env.PHONE_STORE.put('trigger_state', JSON.stringify(state)); }
    return new Response(JSON.stringify(state), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
}