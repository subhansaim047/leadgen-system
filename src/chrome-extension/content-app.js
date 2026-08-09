// Injected into the Next.js Dashboard
console.log("LeadGen Chrome Extension injected into Dashboard!");

// Let the React app know the extension is installed
window.postMessage({ type: 'EXTENSION_INSTALLED', version: '1.0' }, '*');

// Listen for messages from the React app (Frontend -> Extension)
window.addEventListener("message", (event) => {
  // Only accept messages from the same window
  if (event.source !== window) return;

  const data = event.data;
  
  if (data.type === 'START_LIVE_SCRAPE') {
    console.log("Dashboard requested live scrape:", data.payload);
    // Forward to background script to open Google Maps tab
    chrome.runtime.sendMessage({
      action: 'START_MAPS_SCRAPE',
      payload: data.payload
    });
  }
});

// Listen for messages from the background script (Maps -> Background -> Here -> Frontend)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'LEAD_SCRAPED') {
    // Forward the scraped lead to the React app
    window.postMessage({
      type: 'LEAD_SCRAPED',
      payload: message.payload
    }, '*');
  }
  
  if (message.action === 'SCRAPE_FINISHED') {
    window.postMessage({
      type: 'SCRAPE_FINISHED'
    }, '*');
  }
});
