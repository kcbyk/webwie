const { app, BrowserWindow, BrowserView, session, ipcMain } = require('electron');
const path = require('path');

// Ana pencere ve BrowserView referansları
let mainWindow;
let tiktokView;

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
      nodeIntegration: true, // Ana pencere için node entegrasyonunu aç (index.html için)
      contextIsolation: false, // Context isolation'u kapat (index.html için)
    },
    title: "Solenz Studio - TikTok Wrapper",
    // icon: path.join(__dirname, 'assets/icon.png') // Opsiyonel: Simge dosyası
  });

  // TikTok için BrowserView oluştur
  tiktokView = new BrowserView({
    webPreferences: {
      webSecurity: false,
      allowRunningInsecureContent: true,
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // BrowserView'i ana pencereye ekle
  mainWindow.addBrowserView(tiktokView);

  // BrowserView'in boyutlarını ayarla (üstte kontrol paneli için 60px boşluk)
  function updateViewBounds() {
    const { width, height } = mainWindow.getContentBounds();
    tiktokView.setBounds({ x: 0, y: 60, width, height: height - 60 });
  }

  updateViewBounds();
  mainWindow.on('resize', updateViewBounds);

  // TikTok'u yükle
  tiktokView.webContents.loadURL('https://www.tiktok.com');

  // Eğer geliştirme modundaysak, geliştirici araçlarını aç
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
    tiktokView.webContents.openDevTools();
  }

  // Ana HTML dosyasını yükle
  mainWindow.loadFile('index.html');

  // Pencere kapatıldığında referansı temizle
  mainWindow.on('closed', () => {
    mainWindow = null;
    tiktokView = null;
  });

  // Setup header removal for TikTok view
  setupHeaderRemovalForSession(tiktokView.webContents.session);
}

// IPC handlers for preload/api calls
ipcMain.handle('remove-ads', async () => {
  if (tiktokView) {
    return tiktokView.webContents.executeJavaScript(`window.solenzAPI.removeAds()`);
  }
});

ipcMain.handle('capture-videos', async () => {
  if (tiktokView) {
    return tiktokView.webContents.executeJavaScript(`window.solenzAPI.captureVideoLinks()`);
  }
});

ipcMain.handle('start-scroll', async () => {
  if (tiktokView) {
    return tiktokView.webContents.executeJavaScript(`window.solenzAPI.startAutoScroll()`);
  }
});

ipcMain.handle('stop-scroll', async () => {
  if (tiktokView) {
    return tiktokView.webContents.executeJavaScript(`window.solenzAPI.stopAutoScroll()`);
  }
});

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