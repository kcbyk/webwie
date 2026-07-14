const { contextBridge, ipcRenderer } = require('electron');

// Main process ile renderer process arasındaki güvenli iletişim için API oluştur
contextBridge.exposeInMainWorld('solenzAPI', {
  // DOM manipülasyonu yardımcı fonksiyonlarını expose et
  removeAds: () => removeTikTokAds(),
  captureVideoLinks: () => captureTikTokVideoLinks(),
  startAutoScroll: () => startAutoScroll(),
  stopAutoScroll: () => stopAutoScroll(),
  // Renderer'dan main process'e mesaj gönderme
  sendMessage: (channel, data) => ipcRenderer.send(channel, data),
  // Main process'ten renderer'a mesaj alma
  onMessage: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(...args))
});

// Auto scroll için interval referansı
let autoScrollInterval = null;

/**
 * TikTok sayfasındaki reklamları kaldırır
 */
function removeTikTokAds() {
  console.log('[Solenz Studio] Reklamlar kaldırılıyor...');
  
  // Reklam öğelerini seçmek için olası seçiciler (TikTok'un yapısı değişebilir!)
  const adSelectors = [
    '[data-e2e*="ad"]',
    '[class*="ad-"]',
    '[class*="Ad"]',
    '#ad-container',
    '.ad-container'
  ];
  
  // Her seçici için öğeleri bul ve sil
  adSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      el.style.display = 'none'; // Gizle (veya kaldır: el.remove();)
      console.log('[Solenz Studio] Reklam öğesi gizlendi:', selector);
    });
  });
}

/**
 * TikTok sayfasındaki video kaynaklarını (.mp4) yakalar
 */
function captureTikTokVideoLinks() {
  console.log('[Solenz Studio] Video linkleri yakalanıyor...');
  
  // Video öğelerini bul
  const videoElements = document.querySelectorAll('video');
  const videoLinks = [];
  
  videoElements.forEach((video, index) => {
    if (video.src) {
      videoLinks.push({
        index: index + 1,
        url: video.src,
        type: video.type || 'video/mp4'
      });
      console.log(`[Solenz Studio] Video ${index + 1} bulundu:`, video.src);
    }
  });
  
  // Bulunan linkleri main process'e gönder
  ipcRenderer.send('video-links-captured', videoLinks);
  return videoLinks;
}

/**
 * Otomatik kaydırma başlatır
 */
function startAutoScroll() {
  console.log('[Solenz Studio] Otomatik kaydırma başlatılıyor...');
  
  if (autoScrollInterval) {
    console.log('[Solenz Studio] Zaten kaydırma aktif!');
    return;
  }
  
  // Her 2 saniyede bir aşağı kaydır
  autoScrollInterval = setInterval(() => {
    window.scrollBy({
      top: window.innerHeight * 0.8, // Sayfanın 80%'si kadar kaydır
      behavior: 'smooth' // Yumuşak kaydırma
    });
    console.log('[Solenz Studio] Otomatik kaydırıldı');
  }, 2000);
}

/**
 * Otomatik kaydırmayı durdurur
 */
function stopAutoScroll() {
  console.log('[Solenz Studio] Otomatik kaydırma durduruluyor...');
  
  if (autoScrollInterval) {
    clearInterval(autoScrollInterval);
    autoScrollInterval = null;
    console.log('[Solenz Studio] Kaydırma durduruldu');
  } else {
    console.log('[Solenz Studio] Aktif kaydırma yok!');
  }
}

// Sayfa yüklendiğinde varsayılan işlemler (örneğin reklamları kaldır)
window.addEventListener('DOMContentLoaded', () => {
  console.log('[Solenz Studio] Sayfa yüklendi!');
  
  // 1 saniye sonra reklamları kaldırmayı dene
  setTimeout(removeTikTokAds, 1000);
  
  // İsteğe bağlı: Sürekli olarak reklamları kontrol et ve kaldır
  setInterval(removeTikTokAds, 5000);
});