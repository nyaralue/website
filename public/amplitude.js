// Amplitude Analytics Integration for Nyara Luxe
(function () {
    // -------------------------------------------------------------
    // AMPLITUDE API KEY CONFIGURATION
    // -------------------------------------------------------------
    // Set your Amplitude Project API Key here, or define window.AMPLITUDE_API_KEY prior to script load.
    const DEFAULT_KEY = 'b77cd9b20bc5f120be24f3e5d0dac07f';
    const AMPLITUDE_API_KEY = window.AMPLITUDE_API_KEY || DEFAULT_KEY;

    if (!AMPLITUDE_API_KEY || AMPLITUDE_API_KEY === 'YOUR_AMPLITUDE_API_KEY') {
        console.warn('[Amplitude] Running with placeholder API Key. Replace YOUR_AMPLITUDE_API_KEY in amplitude.js or set window.AMPLITUDE_API_KEY to start recording live data.');
    }

    // Queue for events fired before SDK is initialized
    window.amplitudeQueue = window.amplitudeQueue || [];

    // Helper: Safely track custom Amplitude events
    window.trackAmplitudeEvent = function (eventName, eventProperties = {}) {
        const enrichedProps = Object.assign({
            page_title: document.title,
            page_url: window.location.href,
            page_path: window.location.pathname,
            timestamp: new Date().toISOString()
        }, eventProperties);

        if (window.amplitude && typeof window.amplitude.track === 'function' && window.amplitudeInitialized) {
            window.amplitude.track(eventName, enrichedProps);
        } else {
            window.amplitudeQueue.push({ eventName, eventProperties: enrichedProps });
        }
    };

    // Helper: Identify user and set user traits
    window.identifyAmplitudeUser = function (userId, userProperties = {}) {
        if (window.amplitude && typeof window.amplitude.setUserId === 'function') {
            if (userId) {
                window.amplitude.setUserId(String(userId));
            }
            if (userProperties && Object.keys(userProperties).length > 0 && typeof window.amplitude.Identify === 'function') {
                const identify = new window.amplitude.Identify();
                for (const [key, val] of Object.entries(userProperties)) {
                    if (val !== undefined && val !== null) {
                        identify.set(key, val);
                    }
                }
                window.amplitude.identify(identify);
            }
        }
    };

    // Load Amplitude Browser SDK v2 via CDN
    const sdkScript = document.createElement('script');
    sdkScript.type = 'text/javascript';
    sdkScript.async = true;
    sdkScript.src = 'https://cdn.amplitude.com/libs/analytics-browser-2.11.1-min.js.gz';

    sdkScript.onload = function () {
        if (window.amplitude && typeof window.amplitude.init === 'function') {
            window.amplitude.init(AMPLITUDE_API_KEY, undefined, {
                defaultTracking: {
                    sessions: true,
                    pageViews: true,
                    formInteractions: true,
                    fileDownloads: true
                },
                minIdLength: 1
            });
            window.amplitudeInitialized = true;
            console.log('[Amplitude] Initialized successfully. Tracking sessions, page views, and interactions.');

            // Flush any queued events
            if (window.amplitudeQueue && window.amplitudeQueue.length > 0) {
                window.amplitudeQueue.forEach(item => {
                    window.amplitude.track(item.eventName, item.eventProperties);
                });
                window.amplitudeQueue = [];
            }
        }
    };

    sdkScript.onerror = function () {
        console.error('[Amplitude] Failed to load Amplitude Browser SDK script from CDN.');
    };

    document.head.appendChild(sdkScript);

    // -------------------------------------------------------------
    // E-Commerce Outbound Platform Click Integration
    // Hooks seamlessly with existing window.trackPlatformClick
    // -------------------------------------------------------------
    const previousTrackPlatformClick = window.trackPlatformClick;

    window.trackPlatformClick = function (platformName, productName, productId) {
        // Call previous handler (GA4)
        if (typeof previousTrackPlatformClick === 'function') {
            try {
                previousTrackPlatformClick(platformName, productName, productId);
            } catch (e) {
                console.error('[Tracking] Error in previous trackPlatformClick:', e);
            }
        }

        // Track into Amplitude
        window.trackAmplitudeEvent('Ecommerce Platform Clicked', {
            platform: platformName,
            product_name: productName || 'unknown',
            product_id: productId || 'unknown'
        });
    };
})();
