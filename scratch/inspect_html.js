async function inspectBing() {
  const cities = ['Gujranwala', 'Daska', 'Sialkot'];
  for (const c of cities) {
    console.log(`\n=== BING SEARCH TEST FOR: ${c} ===`);
    const q = encodeURIComponent(`"beauty salon" OR "parlour" ${c} Pakistan`);
    const res = await fetch(`https://www.bing.com/search?q=${q}`, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9' 
      }
    });
    const html = await res.text();
    const h2Matches = [...html.matchAll(/<h2><a href="([^"]+)".*?>\s*(.*?)\s*<\/a><\/h2>/gi)];
    console.log(`Bing found ${h2Matches.length} h2 links for ${c}:`);
    h2Matches.slice(0, 10).forEach(m => {
      const cleanTitle = m[2].replace(/<[^>]+>/g, '').trim();
      console.log(`- Title: ${cleanTitle} | Link: ${m[1]}`);
    });
  }
}
inspectBing();
