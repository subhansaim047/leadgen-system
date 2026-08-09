// Injected into the Next.js Dashboard
if (!window.location.href.includes('/maps')) {
  console.log("LeadGen Chrome Extension injected into Dashboard!");

  // Send heartbeat so React catches the extension connection regardless of load timing
  setInterval(() => {
    window.postMessage({ type: 'EXTENSION_INSTALLED', version: '1.0' }, '*');
  }, 1000);

  // Listen for messages from the React app (Frontend -> Extension)
  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data) return;
    
    if (data.type === 'START_LIVE_SCRAPE') {
      console.log("Dashboard requested live scrape:", data.payload);
      try {
        if (chrome.runtime && chrome.runtime.id) {
          chrome.runtime.sendMessage({
            action: 'START_MAPS_SCRAPE',
            payload: data.payload
          });
        } else {
          alert("Extension background was updated. Please refresh (F5) this webpage and try again!");
        }
      } catch (err) {
        console.warn("Extension context invalidated:", err);
        alert("Extension connection was lost due to extension reload. Please refresh (F5) this webpage!");
      }
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
}
