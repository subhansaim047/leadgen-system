async function testDdgApi() {
  const cities = ['Gujranwala', 'Daska', 'Sialkot', 'Austin', 'Dubai', 'Lahore'];
  for (const c of cities) {
    console.log(`\n=== DDG API TEST FOR: ${c} ===`);
    const q = encodeURIComponent(`beauty salon in ${c}`);
    const url = `https://api.duckduckgo.com/?q=${q}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(url);
    const data = await res.json();
    console.log(`RelatedTopics length:`, data.RelatedTopics?.length || 0);
    if (data.RelatedTopics) {
      data.RelatedTopics.slice(0, 5).forEach(t => {
        if (t.Text) console.log(`- ${t.Text}`);
      });
    }
  }
}
testDdgApi();
