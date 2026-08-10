let scrapingTabId = null;
let appTabId = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'START_MAPS_SCRAPE') {
    appTabId = (sender && sender.tab) ? sender.tab.id : null;
    const { niche, city, country, limit, website_filter, source } = message.payload;
    
    let targetUrl = `https://www.google.com/maps/search/${encodeURIComponent(niche + " in " + city + " " + country)}`;
    
    if (source === 'linkedin_live') {
      targetUrl = `https://html.duckduckgo.com/html/?q=site:linkedin.com/company+${encodeURIComponent(niche + " " + city + " " + country)}`;
    } else if (source === 'facebook_live') {
      targetUrl = `https://html.duckduckgo.com/html/?q=site:facebook.com+${encodeURIComponent(niche + " " + city + " " + country)}`;
    } else if (source === 'instagram_live') {
      targetUrl = `https://html.duckduckgo.com/html/?q=site:instagram.com+${encodeURIComponent(niche + " " + city + " " + country)}`;
    } else if (source === 'yelp_live') {
      targetUrl = `https://www.yelp.com/search?find_desc=${encodeURIComponent(niche)}&find_loc=${encodeURIComponent(city + ', ' + country)}`;
    } else if (source === 'bing_places_live') {
      targetUrl = `https://www.bing.com/maps?q=${encodeURIComponent(niche + " in " + city + " " + country)}`;
    } else if (source === 'apple_maps_live') {
      targetUrl = `https://www.google.com/maps/search/${encodeURIComponent(niche + " in " + city + " " + country)}`;
    } else if (source === 'chamber_commerce') {
      targetUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent('chamber of commerce directory ' + niche + ' ' + city + ' ' + country)}`;
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
