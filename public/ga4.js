// Google Analytics 4 (GA4) Integration for Nyara Luxe
(function() {
    // Replace 'G-XXXXXXXXXX' with your actual GA4 Measurement ID, or set window.GA_MEASUREMENT_ID prior to script load.
    const GA_MEASUREMENT_ID = window.GA_MEASUREMENT_ID || 'G-8R6Z1TTL89';

    if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
        console.warn('[GA4] Measurement ID is currently set to placeholder (G-XXXXXXXXXX). Update GA_MEASUREMENT_ID in ga4.js with your actual GA4 Measurement ID.');
    }

    // Load gtag.js asynchronously
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // Global dataLayer setup
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
        send_page_view: true
    });

    // Helper for custom event tracking
    window.trackGAEvent = function(eventName, params = {}) {
        if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, params);
        }
    };

    // E-commerce platform outbound click tracking
    window.trackPlatformClick = function(platformName, productName, productId) {
        window.trackGAEvent('select_content', {
            content_type: 'ecommerce_platform',
            item_id: productId || 'unknown',
            item_name: productName || 'unknown',
            platform: platformName
        });
    };
})();
