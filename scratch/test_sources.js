async function testSources() {
  const cities = ['Gujranwala', 'Daska', 'Sialkot'];
  
  for (const c of cities) {
    console.log(`\n================ YAHOO / GOOGLE HARVEST FOR: ${c} ================`);
    try {
      const q = encodeURIComponent(`beauty salon parlour in ${c} Pakistan`);
      const res = await fetch(`https://search.yahoo.com/search?p=${q}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      const html = await res.text();
      // Yahoo h3 links
      const h3Matches = [...html.matchAll(/<h3 class="title"[^>]*>\s*<a href="([^"]+)".*?>\s*(.*?)\s*<\/a>\s*<\/h3>/gi)];
      console.log(`Yahoo found ${h3Matches.length} h3 results for ${c}:`);
      
      h3Matches.slice(0, 10).forEach(m => {
        const title = m[2].replace(/<[^>]+>/g, '').replace(/\s*[-|–|—]\s*(Facebook|Instagram|Yelp|Google Maps|Yellow Pages|YouTube|LinkedIn|Twitter).*$/gi, '').trim();
        console.log(`- Title: ${title}`);
      });
    } catch (e) {
      console.error('Yahoo err:', e.message);
    }
  }
}
testSources();
