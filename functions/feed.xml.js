export async function onRequest(context) {
  try {
    const GIST_ID = "0f719dd44c5c9bce109b0bce767f9162";
    
    // Try API first
    const r = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: { "User-Agent": "FOSNALIC-Feed" }
    });

    if (!r.ok) {
      return new Response(`Gist fetch failed: ${r.status} - ${await r.text()}`, { status: 500 });
    }

    const j = await r.json();
    
    if (!j.files || !j.files['fosnalic-data.json']) {
      return new Response(`File not found in Gist. Files found: ${Object.keys(j.files || {}).join(', ')}`, { status: 500 });
    }

    const data = JSON.parse(j.files['fosnalic-data.json'].content);
    const products = data.products || data.items || data.store || [];

    if (products.length === 0) {
      return new Response(`Gist loaded but 0 products. Data keys: ${Object.keys(data).join(', ')}`, { status: 500 });
    }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>FOSNALIC Techs</title>
<link>https://fosnalic.pages.dev</link>
<description>Buy laptops, chargers, software at FOSNALIC Techs Kampala</description>`;

    products.forEach((p, i) => {
      const id = String(p.id || p.sku || `FOS${i}`).replace(/&/g, "&amp;");
      const title = String(p.title || p.name || "Product").replace(/&/g, "&amp;").replace(/</g, "&lt;");
      const price = String(p.price || "").replace(/[^0-9]/g, '') || "0";
      const img = p.image || p.img || "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800";
      const desc = String(p.description || p.desc || title).replace(/&/g, "&amp;").replace(/</g, "&lt;").substring(0, 500);
      const brand = String(p.brand || "FOSNALIC").replace(/&/g, "&amp;");

      xml += `
<item>
<g:id>${id}</g:id>
<g:title>${title}</g:title>
<g:description>${desc}</g:description>
<g:link>https://fosnalic.pages.dev/products.html#${id}</g:link>
<g:image_link>${img}</g:image_link>
<g:condition>new</g:condition>
<g:availability>in_stock</g:availability>
<g:price>${price} UGX</g:price>
<g:brand>${brand}</g:brand>
</item>`;
    });

    xml += `</channel></rss>`;

    return new Response(xml, {
      headers: { "Content-Type": "application/xml; charset=utf-8" }
    });

  } catch (e) {
    return new Response(`ERROR: ${e.message} | Stack: ${e.stack}`, { status: 500 });
  }
}