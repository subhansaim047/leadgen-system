async function testRaw() {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent('beauty salon in Gujranwala Pakistan')}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  const text = await res.text();
  console.log('HTML length:', text.length);
  console.log('Sample HTML:', text.substring(0, 800));
}
testRaw();
