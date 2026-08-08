async function parseDdg() {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent('beauty salon in Gujranwala Pakistan')}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  const text = await res.text();
  
  // Find all <a class="result__a" href="...">Title</a>
  const matches = [...text.matchAll(/<a class="result__a" href="([^"]+)".*?>\s*(.*?)\s*<\/a>/gi)];
  console.log(`Found ${matches.length} result__a matches:`);
  matches.forEach((m, idx) => {
    const title = m[2].replace(/<[^>]+>/g, '').trim();
    console.log(`${idx + 1}. Title: ${title} | Link: ${m[1]}`);
  });
}
parseDdg();
