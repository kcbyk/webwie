const { createProxyMiddleware } = require('http-proxy-middleware');

// Vercel serverless function proxy
module.exports = (req, res) => {
  const proxy = createProxyMiddleware({
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
    pathRewrite: (path) => {
      return path.replace('/api', '');
    },
  });

  proxy(req, res, (err) => {
    if (err) {
      res.status(500).send('Proxy Error');
    }
  });
};
