document.addEventListener('DOMContentLoaded', () => {
    const iframe = document.getElementById('tiktok-frame');
    const loader = document.getElementById('loader');
    
    // Use our local proxy server
    iframe.src = '/tiktok';
    
    iframe.onload = () => {
        loader.classList.add('hidden');
    };
    
    iframe.onerror = () => {
        loader.querySelector('p').textContent = 'Bağlantı hatası!';
    };
});
