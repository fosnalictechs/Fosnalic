let triggerState = { trigger: false, time: null };

export async function onRequestPost(context) {
  triggerState = { trigger: true, time: Date.now() };
  if (context.env?.PHONE_STORE) {
    await context.env.PHONE_STORE.put('trigger_state', JSON.stringify(triggerState));
  }
  return new Response(JSON.stringify({ success: true, trigger: true }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}

export async function onRequestGet(context) {
  let state = triggerState;
  if (context.env?.PHONE_STORE) {
    const saved = await context.env.PHONE_STORE.get('trigger_state');
    if (saved) state = JSON.parse(saved);
  }

  // If triggered, return true ONCE then immediately set to false
  if (state.trigger && state.time) {
    const age = Date.now() - state.time;
    if (age > 35000) { // expired 35 sec
      state = { trigger: false, time: null };
    } else {
      // RETURN true then clear for next request
      const responseState = { trigger: true, time: state.time };
      // Clear immediately after
      triggerState = { trigger: false, time: null };
      if (context.env?.PHONE_STORE) {
        await context.env.PHONE_STORE.put('trigger_state', JSON.stringify(triggerState));
      }
      return new Response(JSON.stringify(responseState), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }

  return new Response(JSON.stringify({ trigger: false }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' }
  });
}