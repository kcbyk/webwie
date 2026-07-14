const express = require('express');
const httpProxy = require('http-proxy');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Create proxy server
const proxy = httpProxy.createProxyServer({
    target: 'https://www.tiktok.com',
    changeOrigin: true,
    secure: true,
});

// Handle proxy response and remove blocking headers
proxy.on('proxyRes', (proxyRes, req, res) => {
    console.log('=== Received response headers from TikTok ===');
    console.log(JSON.stringify(proxyRes.headers, null, 2));
    
    // Remove ALL frame-blocking headers, case-insensitively
    const headersToRemove = [
        'x-frame-options',
        'content-security-policy',
        'content-security-policy-report-only',
        'x-content-security-policy',
        'x-webkit-csp'
    ];
    
    for (const key of Object.keys(proxyRes.headers)) {
        const lowerKey = key.toLowerCase();
        if (headersToRemove.includes(lowerKey)) {
            console.log(`Removing header: ${key}`);
            delete proxyRes.headers[key];
        }
    }
    
    console.log('=== Response headers after cleanup ===');
    console.log(JSON.stringify(proxyRes.headers, null, 2));
});

// Handle proxy errors
proxy.on('error', (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).send('Proxy Error');
});

// Serve static files (index.html, styles.css, script.js)
app.use(express.static(path.join(__dirname)));

// Proxy /tiktok and /api paths to TikTok
app.use(['/tiktok', '/api'], (req, res) => {
    // Rewrite the path: remove /tiktok or /api prefix
    req.url = req.url.replace(/^\/(tiktok|api)/, '') || '/';
    console.log(`Proxying ${req.method} ${req.url} to TikTok`);
    proxy.web(req, res);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT} and http://127.0.0.1:${PORT}`);
});
