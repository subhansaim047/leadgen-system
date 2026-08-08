async function testDirectory() {
  const cities = ['gujranwala', 'sialkot', 'daska', 'lahore'];
  for (const c of cities) {
    console.log(`\n=== REAL DIRECTORY FETCH FOR: ${c} ===`);
    try {
      const url = `https://pk.placedigger.com/category/beauty-salon/location/${c}/`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
      const html = await res.text();
      const matches = [...html.matchAll(/<h3><a href="[^"]+">\s*(.*?)\s*<\/a><\/h3>/gi)];
      console.log(`Found ${matches.length} real listings in ${c}:`);
      matches.slice(0, 10).forEach(m => console.log('Real place:', m[1]));
    } catch (e) {
      console.error('Err:', e.message);
    }
  }
}
testDirectory();
