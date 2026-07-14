const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(path.join(__dirname)));

// Proxy TikTok
app.use('/tiktok', createProxyMiddleware({
    target: 'https://www.tiktok.com',
    changeOrigin: true,
    secure: true,
    onProxyRes: (proxyRes) => {
        // Remove X-Frame-Options header
        delete proxyRes.headers['x-frame-options'];
        delete proxyRes.headers['content-security-policy'];
    },
    pathRewrite: {
        '^/tiktok': '',
    },
}));

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
