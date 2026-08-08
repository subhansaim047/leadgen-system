async function testDaskaReal() {
  const cities = ['Gujranwala', 'Daska', 'Sialkot'];
  for (const c of cities) {
    console.log(`\n================ REAL LIVE SEARCH FOR: ${c} ================`);
    const q = encodeURIComponent(`beauty salon parlour in ${c} Pakistan`);
    const url = `https://html.duckduckgo.com/html/?q=${q}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      }
    });
    const text = await res.text();
    
    // Exact Regex matching DuckDuckGo result links
    const matches = [...text.matchAll(/<a class="result__snippet"[^>]*href="([^"]+)"[^>]*>\s*(.*?)\s*<\/a>|<a class="result__a"[^>]*href="([^"]+)"[^>]*>\s*(.*?)\s*<\/a>/gi)];
    
    // Extract titles
    const links = [...text.matchAll(/<a[^>]+href="\/\/duckduckgo\.com\/l\/\?uddg=([^"&]+)[^"]*"[^>]*>\s*(.*?)\s*<\/a>/gi)];
    
    console.log(`Extracted ${links.length} live links for ${c}:`);
    const seen = new Set();
    links.forEach(l => {
      const decodedUrl = decodeURIComponent(l[1]);
      const rawTitle = l[2].replace(/<[^>]+>/g, '').trim();
      const cleanTitle = rawTitle.replace(/\s*[-|–|—]\s*(Facebook|Instagram|Yelp|Google Maps|Yellow Pages|YouTube|LinkedIn|Twitter).*$/gi, '').trim();
      
      if (cleanTitle && !seen.has(cleanTitle) && !cleanTitle.includes('http') && !cleanTitle.includes('.com')) {
        seen.add(cleanTitle);
        console.log(`- Business: ${cleanTitle}`);
        console.log(`  Url: ${decodedUrl}`);
      }
    });
  }
}
testDaskaReal();
