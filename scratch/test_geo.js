async function testGeo() {
  const cities = ['Gujranwala', 'Daska', 'Sialkot', 'Lahore'];
  for (const c of cities) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&extratags=1&addressdetails=1&q=${encodeURIComponent('beauty salon in ' + c + ' Pakistan')}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'LeadGenApp/1.0 (subhansaim047@gmail.com)' } });
    const data = await res.json();
    console.log(`=== NOMINATIM PLACES FOR ${c} ===`);
    data.forEach(item => {
      console.log(`Name: ${item.display_name.split(',')[0]} | Type: ${item.type} | Address: ${item.display_name}`);
    });
  }
}
testGeo();
