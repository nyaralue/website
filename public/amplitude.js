// Amplitude Analytics Integration for Nyara Luxe
(function () {
    // -------------------------------------------------------------
    // AMPLITUDE API KEY CONFIGURATION
    // -------------------------------------------------------------
    const DEFAULT_KEY = 'b77cd9b20bc5f120be24f3e5d0dac07f';
    const AMPLITUDE_API_KEY = window.AMPLITUDE_API_KEY || DEFAULT_KEY;

    if (!AMPLITUDE_API_KEY || AMPLITUDE_API_KEY === 'YOUR_AMPLITUDE_API_KEY') {
        console.warn('[Amplitude] Running with placeholder API Key. Replace YOUR_AMPLITUDE_API_KEY in amplitude.js or set window.AMPLITUDE_API_KEY to start recording live data.');
    }

    // Queues for events and identify calls fired before SDK is initialized
    window.amplitudeQueue = window.amplitudeQueue || [];
    window.amplitudeIdentifyQueue = window.amplitudeIdentifyQueue || [];

    // Helper: Detect device type
    function getDeviceType() {
        const ua = navigator.userAgent || '';
        if (/tablet|ipad|playbook|silk/i.test(ua)) return 'Tablet';
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle/i.test(ua)) return 'Mobile';
        return 'Desktop';
    }

    // Helper: Extract UTM parameters from URL
    function getUtmParameters() {
        try {
            const params = new URLSearchParams(window.location.search);
            const utm = {};
            ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(key => {
                const val = params.get(key);
                if (val) utm[key] = val;
            });
            return utm;
        } catch (e) {
            return {};
        }
    }

    // Helper: Safely track custom Amplitude events
    window.trackAmplitudeEvent = function (eventName, eventProperties = {}) {
        const enrichedProps = Object.assign({
            page_title: document.title,
            page_url: window.location.href,
            page_path: window.location.pathname,
            referrer: document.referrer || 'direct',
            device_type: getDeviceType(),
            timestamp: new Date().toISOString()
        }, getUtmParameters(), eventProperties);

        if (window.amplitude && typeof window.amplitude.track === 'function' && window.amplitudeInitialized) {
            window.amplitude.track(eventName, enrichedProps);
            console.log(`[Amplitude Tracked] ${eventName}:`, enrichedProps);
        } else {
            window.amplitudeQueue.push({ eventName, eventProperties: enrichedProps });
        }
    };

    // Helper: Identify user and set user traits
    window.identifyAmplitudeUser = function (userId, userProperties = {}) {
        if (window.amplitude && typeof window.amplitude.setUserId === 'function' && window.amplitudeInitialized) {
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
            console.log(`[Amplitude Identified] User: ${userId}`, userProperties);
        } else {
            window.amplitudeIdentifyQueue.push({ userId, userProperties });
        }
    };

    let pageViewFired = false;
    function firePageViewOnce() {
        if (pageViewFired) return;
        pageViewFired = true;
        window.trackAmplitudeEvent('Page Viewed', {
            page_title: document.title,
            page_path: window.location.pathname
        });
    }

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
            console.log('[Amplitude] Initialized successfully. Tracking sessions, page views, and full funnel.');

            // Flush queued identify calls
            if (window.amplitudeIdentifyQueue && window.amplitudeIdentifyQueue.length > 0) {
                window.amplitudeIdentifyQueue.forEach(item => {
                    window.identifyAmplitudeUser(item.userId, item.userProperties);
                });
                window.amplitudeIdentifyQueue = [];
            }

            // Flush queued events
            if (window.amplitudeQueue && window.amplitudeQueue.length > 0) {
                window.amplitudeQueue.forEach(item => {
                    window.amplitude.track(item.eventName, item.eventProperties);
                });
                window.amplitudeQueue = [];
            }

            // Track standard explicit Page Viewed for Funnel Step 1
            firePageViewOnce();
        }
    };

    sdkScript.onerror = function () {
        console.error('[Amplitude] Failed to load Amplitude Browser SDK script from CDN.');
    };

    document.head.appendChild(sdkScript);

    // Also ensure Page Viewed is registered in queue if script hasn't loaded yet
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', firePageViewOnce);
    } else {
        firePageViewOnce();
    }

    // -------------------------------------------------------------
    // E-Commerce Outbound Platform Click Integration
    // Hooks seamlessly with existing window.trackPlatformClick
    // -------------------------------------------------------------
    const previousTrackPlatformClick = window.trackPlatformClick;

    window.trackPlatformClick = function (platformName, productName, productId, extraProps = {}) {
        // Call previous handler (GA4)
        if (typeof previousTrackPlatformClick === 'function') {
            try {
                previousTrackPlatformClick(platformName, productName, productId);
            } catch (e) {
                console.error('[Tracking] Error in previous trackPlatformClick:', e);
            }
        }

        const platformProps = Object.assign({
            platform: platformName,
            product_name: productName || 'unknown',
            product_id: productId || 'unknown',
            destination_type: platformName === 'Nyara Luxe Direct' ? 'internal_checkout' : 'external_marketplace'
        }, extraProps);

        // Track standard Ecommerce Platform Clicked for Funnel Step 4
        window.trackAmplitudeEvent('Ecommerce Platform Clicked', platformProps);
    };
})();
