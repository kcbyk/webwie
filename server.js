const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(path.join(__dirname)));

// Proxy TikTok for local development
app.use('/tiktok', createProxyMiddleware({
    target: 'https://www.tiktok.com',
    changeOrigin: true,
    secure: true,
    onProxyRes: (proxyRes) => {
        // Remove X-Frame-Options and CSP headers
        delete proxyRes.headers['x-frame-options'];
        delete proxyRes.headers['content-security-policy'];
        delete proxyRes.headers['x-content-security-policy'];
        delete proxyRes.headers['x-webkit-csp'];
    },
    pathRewrite: {
        '^/tiktok': '',
    },
}));

// Also handle /api path for consistency with Vercel
app.use('/api', createProxyMiddleware({
    target: 'https://www.tiktok.com',
    changeOrigin: true,
    secure: true,
    onProxyRes: (proxyRes) => {
        delete proxyRes.headers['x-frame-options'];
        delete proxyRes.headers['content-security-policy'];
        delete proxyRes.headers['x-content-security-policy'];
        delete proxyRes.headers['x-webkit-csp'];
    },
    pathRewrite: {
        '^/api': '',
    },
}));

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
