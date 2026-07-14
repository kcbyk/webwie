document.addEventListener('DOMContentLoaded', () => {
    const iframe = document.getElementById('tiktok-frame');
    const loader = document.getElementById('loader');
    
    // Check if running locally or on Vercel
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const proxyPath = isLocal ? '/tiktok' : '/api';
    
    iframe.src = proxyPath;
    
    iframe.onload = () => {
        loader.classList.add('hidden');
    };
    
    iframe.onerror = () => {
        loader.querySelector('p').textContent = 'Bağlantı hatası! TikTok bu şekilde gömülmeyi engelliyor.';
    };
});
