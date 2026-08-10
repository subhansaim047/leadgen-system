let scrapingTabId = null;
let appTabId = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'START_MAPS_SCRAPE') {
    appTabId = (sender && sender.tab) ? sender.tab.id : null;
    const { niche, city, country, limit, website_filter, source } = message.payload;
    
    let targetUrl = `https://www.google.com/maps/search/${encodeURIComponent(niche + " in " + city + " " + country)}`;
    
    if (source === 'linkedin_live') {
      targetUrl = `https://www.google.com/search?q=${encodeURIComponent('site:linkedin.com/company "' + niche + '" "' + city + '" ' + country)}`;
    } else if (source === 'facebook_live') {
      targetUrl = `https://www.google.com/search?q=${encodeURIComponent('site:facebook.com "' + niche + '" "' + city + '" ' + country)}`;
    } else if (source === 'yelp_live') {
      targetUrl = `https://www.yelp.com/search?find_desc=${encodeURIComponent(niche)}&find_loc=${encodeURIComponent(city + ', ' + country)}`;
    }
    
    // Set storage FIRST so content script finds it immediately
    chrome.storage.local.set({ 
      currentScrapeTask: { niche, city, country, limit: Number(limit) || 20, website_filter, source: source || 'google_maps_live', active: true } 
    }, () => {
      chrome.tabs.create({ url: targetUrl, active: true }, (tab) => {
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
    // Auto-close the maps tab 2.5s after completion
    if (scrapingTabId) {
      setTimeout(() => {
        chrome.tabs.remove(scrapingTabId).catch(() => {});
      }, 2500);
    }
    chrome.storage.local.set({ currentScrapeTask: null });
  }
});
