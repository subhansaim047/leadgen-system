async function findLinks() {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent('beauty salon in Gujranwala Pakistan')}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  const text = await res.text();
  
  // Find all <a href="...">...</a>
  const matches = [...text.matchAll(/<a\s+[^>]*href="([^"]+)"[^>]*>\s*(.*?)\s*<\/a>/gi)];
  console.log(`Found ${matches.length} total <a> tags:`);
  matches.slice(0, 20).forEach((m, idx) => {
    const title = m[2].replace(/<[^>]+>/g, '').trim();
    if (title.length > 2) {
      console.log(`${idx + 1}. Title: ${title} | Link: ${m[1]}`);
    }
  });
}
findLinks();
