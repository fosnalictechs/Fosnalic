export async function onRequest(context) {
  const GIST_ID = "0f719dd44c5c9bce109b0bce767f9162";
  const r = await fetch(`https://api.github.com/gists/${GIST_ID}`);
  const j = await r.json();
  const data = JSON.parse(j.files['fosnalic-data.json'].content);
  const products = data.products || [];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>FOSNALIC Techs</title>
<link>https://fosnalic.pages.dev</link>
<description>Buy laptops, chargers, software at FOSNALIC Techs Kampala</description>`;

  products.forEach((p, i) => {
    const id = p.id || p.sku || `FOS${i}`;
    const title = (p.title || p.name || "Product").replace(/&/g, "&amp;");
    const price = String(p.price || "").replace(/[^0-9]/g, '');
    const img = p.image || p.img || "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800";
    const desc = (p.description || p.desc || title).replace(/&/g, "&amp;").substring(0, 500);
    const brand = p.brand || "FOSNALIC";

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
<g:google_product_category>Electronics</g:google_product_category>
</item>`;
  });

  xml += `</channel></rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" }
  });
}