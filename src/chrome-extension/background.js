let scrapingTabId = null;
let appTabId = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'START_MAPS_SCRAPE') {
    appTabId = sender.tab.id;
    const { niche, city, country, limit, website_filter } = message.payload;
    
    // Format the Google Maps search URL
    const query = encodeURIComponent(`${niche} in ${city} ${country}`);
    const mapsUrl = `https://www.google.com/maps/search/${query}`;
    
    // Set storage FIRST so content script finds it immediately
    chrome.storage.local.set({ 
      currentScrapeTask: { niche, city, country, limit: Number(limit) || 20, website_filter, active: true } 
    }, () => {
      chrome.tabs.create({ url: mapsUrl, active: true }, (tab) => {
        scrapingTabId = tab.id;
      });
    });
  }

  if (message.action === 'LEAD_SCRAPED') {
    // Forward the lead back to the web app tab
    if (appTabId) {
      chrome.tabs.sendMessage(appTabId, message);
    }
  }
  
  if (message.action === 'SCRAPE_FINISHED') {
    if (appTabId) {
      chrome.tabs.sendMessage(appTabId, message);
    }
    // Optionally close the maps tab
    // if (scrapingTabId) chrome.tabs.remove(scrapingTabId);
    chrome.storage.local.set({ currentScrapeTask: null });
  }
});
