async function test() {
  const query = encodeURIComponent('beauty salon in Gujranwala Pakistan');
  const res = await fetch('https://html.duckduckgo.com/html/?q=' + query, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' }
  });
  const html = await res.text();
  
  // Extract titles and links
  const titleMatches = [...html.matchAll(/<a class="result__url" href="([^"]+)".*?>\s*(.*?)\s*<\/a>/gi)];
  const snippetMatches = [...html.matchAll(/<a class="result__snippet".*?>\s*(.*?)\s*<\/a>/gi)];

  console.log('Found titles:', titleMatches.length);
  for (let i = 0; i < Math.min(10, titleMatches.length); i++) {
    console.log(`Title ${i}:`, titleMatches[i][2]);
    console.log(`Snippet ${i}:`, snippetMatches[i]?.[1]?.substring(0, 100));
    console.log('---');
  }
}
test();
