const { contextBridge, ipcRenderer } = require('electron');

console.log('[Solenz Preload] Preload script loaded!');

// Auto scroll interval reference
let autoScrollInterval = null;

/**
 * Remove TikTok ads
 */
function removeTikTokAds() {
  console.log('[Solenz Preload] Removing ads...');
  
  const adSelectors = [
    '[data-e2e*="ad"]',
    '[class*="ad-"]',
    '[class*="Ad"]',
    '#ad-container',
    '.ad-container'
  ];
  
  let removedCount = 0;
  adSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      el.style.display = 'none';
      removedCount++;
    });
  });
  
  console.log(`[Solenz Preload] Hid ${removedCount} ad elements`);
  return { success: true, removedCount };
}

/**
 * Capture TikTok video links
 */
function captureTikTokVideoLinks() {
  console.log('[Solenz Preload] Capturing video links...');
  
  const videoElements = document.querySelectorAll('video');
  const videoLinks = [];
  
  videoElements.forEach((video, index) => {
    if (video.src) {
      videoLinks.push({
        index: index + 1,
        url: video.src,
        type: video.type || 'video/mp4'
      });
    }
  });
  
  console.log(`[Solenz Preload] Captured ${videoLinks.length} video links:`, videoLinks);
  return videoLinks;
}

/**
 * Start auto scroll
 */
function startAutoScroll() {
  console.log('[Solenz Preload] Starting auto scroll...');
  
  if (autoScrollInterval) {
    console.log('[Solenz Preload] Auto scroll already active!');
    return { success: false, message: 'Already active' };
  }
  
  autoScrollInterval = setInterval(() => {
    window.scrollBy({
      top: window.innerHeight * 0.8,
      behavior: 'smooth'
    });
    console.log('[Solenz Preload] Scrolled down');
  }, 2500);
  
  return { success: true, message: 'Auto scroll started' };
}

/**
 * Stop auto scroll
 */
function stopAutoScroll() {
  console.log('[Solenz Preload] Stopping auto scroll...');
  
  if (!autoScrollInterval) {
    console.log('[Solenz Preload] No active auto scroll!');
    return { success: false, message: 'No active scroll' };
  }
  
  clearInterval(autoScrollInterval);
  autoScrollInterval = null;
  
  console.log('[Solenz Preload] Auto scroll stopped');
  return { success: true, message: 'Auto scroll stopped' };
}

// Expose API using contextBridge
contextBridge.exposeInMainWorld('solenzAPI', {
  removeAds: removeTikTokAds,
  captureVideoLinks: captureTikTokVideoLinks,
  startAutoScroll: startAutoScroll,
  stopAutoScroll: stopAutoScroll,
  on: (channel, callback) => {
    ipcRenderer.on(channel, (event, ...args) => callback(...args));
  },
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  }
});

console.log('[Solenz Preload] API exposed to window');

// Optional: Auto-remove ads on page load
window.addEventListener('DOMContentLoaded', () => {
  console.log('[Solenz Preload] DOM loaded, auto-removing ads in 1s...');
  setTimeout(removeTikTokAds, 1000);
  setInterval(removeTikTokAds, 5000);
});
