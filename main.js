const { app, BrowserWindow, session } = require('electron');
const path = require('path');

// Ana pencere referansı (çöp toplamayı önlemek için)
let mainWindow;

/**
 * Verilen session için CSP/X-Frame-Options başlıklarını kaldıran fonksiyon
 */
function setupHeaderRemovalForSession(sess) {
  sess.webRequest.onHeadersReceived((details, callback) => {
    const newHeaders = { ...details.responseHeaders };

    // Frame engelleme başlıklarını (büyük küçük harf duyarsız) sil
    Object.keys(newHeaders).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey === 'x-frame-options' ||
        lowerKey === 'content-security-policy' ||
        lowerKey === 'content-security-policy-report-only' ||
        lowerKey === 'x-content-security-policy' ||
        lowerKey === 'x-webkit-csp'
      ) {
        delete newHeaders[key];
      }
    });

    callback({
      cancel: false,
      responseHeaders: newHeaders
    });
  });
}

function createWindow() {
  // Ana browser penceresini oluştur
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      // Güvenlik ayarlarını devre dışı bırak (geliştirme amaçlı!)
      webSecurity: false, // CORS ve diğer güvenlik kısıtlamalarını kaldır
      allowRunningInsecureContent: true, // Güvenli olmayan içeriğe izin ver
      preload: path.join(__dirname, 'preload.js'), // Preload script dosyasını bağla
      nodeIntegration: false, // Güvenlik için node entegrasyonunu kapalı tut (preload ile iletişim kuracağız)
      contextIsolation: true // Context isolation'u açık tut (güvenlik için)
    },
    title: "Solenz Studio - TikTok Wrapper",
    // icon: path.join(__dirname, 'assets/icon.png') // Opsiyonel: Simge dosyası (oluşturmak için assets klasörü ekleyebilirsin)
  });

  // Eğer geliştirme modundaysak, geliştirici araçlarını aç
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Ana HTML dosyasını yükle
  mainWindow.loadFile('index.html');

  // Pencere kapatıldığında referansı temizle
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Yeni webContents oluşturulduğunda (webview dahil) header removal'u ayarla
  mainWindow.webContents.on('did-attach-webview', (event, webContents) => {
    setupHeaderRemovalForSession(webContents.session);
  });
}

// Electron hazır olduğunda pencereyi oluştur
app.whenReady().then(() => {
  // Varsayılan session için header removal'u ayarla
  setupHeaderRemovalForSession(session.defaultSession);

  createWindow();

  // macOS'te pencere yeniden aktifleştirildiğinde yeniden oluştur
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Tüm pencereler kapatıldığında uygulamayı kapat (Windows/Linux için)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});