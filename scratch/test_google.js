async function testGoogle() {
  const cities = ['Gujranwala', 'Daska', 'Sialkot'];
  for (const city of cities) {
    console.log(`=== TESTING CITY: ${city} ===`);
    const query = encodeURIComponent(`beauty salon in ${city} Pakistan`);
    // Query Google Search HTML Places
    const res = await fetch(`https://www.google.com/search?q=${query}&gbv=1`, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    const html = await res.text();
    
    // Extract place names from Google Search HTML
    const placeMatches = [...html.matchAll(/<div class="BNeawe deAvbc AP7wnd">\s*(.*?)\s*<\/div>|<span class="OSr27e">\s*(.*?)\s*<\/span>|<div class="r">\s*<a href="[^"]+".*?<h3.*?>\s*(.*?)\s*<\/h3>/gi)];
    console.log(`Found ${placeMatches.length} raw matches for ${city}`);
    const names = placeMatches.map(m => (m[1] || m[2] || m[3] || '').replace(/<[^>]+>/g, '').trim()).filter(n => n.length > 3 && !n.includes('Google') && !n.includes('Search'));
    const unique = [...new Set(names)];
    console.log('Sample places:', unique.slice(0, 10));
  }
}
testGoogle();
