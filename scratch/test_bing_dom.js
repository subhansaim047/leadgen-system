async function testBingDom() {
  const cities = ['Gujranwala', 'Daska', 'Sialkot'];
  for (const c of cities) {
    console.log(`\n================ BING DOM TEST FOR: ${c} ================`);
    const q = encodeURIComponent(`beauty salon parlour in ${c} Pakistan`);
    const url = `https://www.bing.com/search?q=${q}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    const html = await res.text();
    // Parse b_algo blocks
    const algoBlocks = [...html.matchAll(/<li class="b_algo">([\s\S]*?)<\/li>/gi)];
    console.log(`Found ${algoBlocks.length} algo blocks for ${c}`);
    
    algoBlocks.slice(0, 10).forEach((b, idx) => {
      const titleMatch = b[1].match(/<a[^>]+href="([^"]+)"[^>]*>\s*(.*?)\s*<\/a>/i);
      const snippetMatch = b[1].match(/<p[^>]*>\s*(.*?)\s*<\/p>/i);
      if (titleMatch) {
        const title = titleMatch[2].replace(/<[^>]+>/g, '').replace(/\s*[-|–|—]\s*(Facebook|Instagram|Yelp|Google Maps|Yellow Pages|YouTube|LinkedIn|Twitter).*$/gi, '').trim();
        const link = titleMatch[1];
        console.log(`Result ${idx + 1}: ${title}`);
        console.log(`Link: ${link}`);
      }
    });
  }
}
testBingDom();
