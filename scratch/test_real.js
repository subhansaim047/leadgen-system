async function testReal() {
  const cities = ['Gujranwala', 'Sialkot', 'Daska'];
  for (const c of cities) {
    console.log(`\n================ REAL GOOGLE SEARCH TEST: ${c} ================`);
    const q = encodeURIComponent(`"beauty salon" OR "parlour" "${c}"`);
    const url = `https://html.duckduckgo.com/html/?q=${q}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });
    const text = await res.text();
    // Parse result title links
    const matches = [...text.matchAll(/<a class="result__url" href="([^"]+)".*?>\s*(.*?)\s*<\/a>/gi)];
    console.log(`Total URLs found for ${c}:`, matches.length);
    matches.slice(0, 8).forEach(m => {
      console.log('URL Host:', m[1]);
      console.log('Title:', m[2]);
    });
  }
}
testReal();
