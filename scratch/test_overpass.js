async function testOverpass() {
  const testCities = ['Gujranwala', 'Daska', 'Sialkot', 'Austin', 'Dubai'];
  
  for (const city of testCities) {
    console.log(`\n=== OVERPASS REAL DATA TEST FOR: ${city} ===`);
    try {
      const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];area["name"="${city}"]->.searchArea;(node["shop"](area.searchArea);node["amenity"](area.searchArea);node["healthcare"](area.searchArea););out body 25;`;
      const res = await fetch(overpassUrl);
      const data = await res.json();
      const elements = data.elements || [];
      console.log(`Found ${elements.length} real places in ${city}`);
      elements.slice(0, 8).forEach(el => {
        if (el.tags && el.tags.name) {
          console.log(`- Name: ${el.tags.name} | Phone: ${el.tags.phone || el.tags['contact:phone'] || 'N/A'} | Suburb: ${el.tags['addr:suburb'] || el.tags['addr:street'] || city}`);
        }
      });
    } catch (e) {
      console.error(e.message);
    }
  }
}
testOverpass();
