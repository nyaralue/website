// Nyara Luxe AI Concierge & Live Customer Support Chatbot

(function () {
    let hasSentOnlineAlert = false;

    // Inject CSS dynamically
    function injectCSS() {
        if (!document.getElementById('nyara-chatbot-css')) {
            const link = document.createElement('link');
            link.id = 'nyara-chatbot-css';
            link.rel = 'stylesheet';
            link.href = 'nyara-chatbot.css';
            document.head.appendChild(link);
        }
    }

    // Inject Widget HTML
    function injectWidget() {
        if (document.getElementById('nyara-chat-widget')) return;

        const widgetHtml = `
        <div id="nyara-chat-widget" class="nyara-chat-widget">
            <!-- Launcher Floating Button -->
            <button id="nyara-chat-launcher" class="nyara-chat-launcher" title="Chat with Nyara Luxe Concierge">
                <i class="fas fa-comments"></i>
                <span class="nyara-chat-badge">1</span>
            </button>

            <!-- Chat Window -->
            <div id="nyara-chat-box" class="nyara-chat-box">
                <!-- Header -->
                <div class="nyara-chat-header">
                    <div class="nyara-chat-header-info">
                        <img src="Nyara_Home_Visiting_Card-removebg-preview.png" alt="Nyara Luxe Logo" class="nyara-chat-avatar">
                        <div class="nyara-chat-title-container">
                            <h4 class="nyara-chat-title">Nyara Luxe Assistant</h4>
                            <span class="nyara-chat-status">
                                <span class="nyara-status-dot"></span> Online | Instant Assist
                            </span>
                        </div>
                    </div>
                    <div class="nyara-chat-header-actions">
                        <a href="https://wa.me/917690082033?text=Hi%20Nyara%20Luxe!%20I%20need%20help%20with%20an%20order" target="_blank" class="nyara-chat-header-btn" title="Chat 1-on-1 on WhatsApp">
                            <i class="fab fa-whatsapp" style="color: #25D366; font-size: 16px;"></i>
                        </a>
                        <button id="nyara-chat-close-btn" class="nyara-chat-header-btn" title="Close Chat">&times;</button>
                    </div>
                </div>

                <!-- Messages Body -->
                <div id="nyara-chat-body" class="nyara-chat-body">
                    <!-- Bot Welcome Message -->
                    <div class="nyara-msg nyara-msg-bot">
                        👋 Namaste! Welcome to <strong>Nyara Luxe</strong> — Soft Luxury for Modern Homes.<br><br>
                        How can I help you today? Select a option below or ask me any question!
                        <div class="nyara-msg-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>

                    <!-- FAQ Action Buttons -->
                    <div class="nyara-chat-faqs">
                        <button class="nyara-faq-btn" onclick="NyaraChat.handleFAQ('products')">💡 Products & Collection</button>
                        <button class="nyara-faq-btn" onclick="NyaraChat.handleFAQ('discounts')">💰 20% OFF & Offers</button>
                        <button class="nyara-faq-btn" onclick="NyaraChat.handleFAQ('shipping')">🚚 Delivery Time</button>
                        <button class="nyara-faq-btn" onclick="NyaraChat.handleFAQ('contact')">📧 Contact Support</button>
                        <button class="nyara-faq-btn" onclick="NyaraChat.handleFAQ('live')">👤 Talk 1-on-1 Live</button>
                    </div>

                    <!-- Direct WhatsApp Banner -->
                    <a href="https://wa.me/917690082033?text=Hi%20Nyara%20Luxe!%20I%20have%20a%20query." target="_blank" class="nyara-whatsapp-banner">
                        <span><i class="fab fa-whatsapp"></i> Want live 1-on-1 help?</span>
                        <strong>Chat on WhatsApp &rarr;</strong>
                    </a>
                </div>

                <!-- Footer Input -->
                <form id="nyara-chat-form" class="nyara-chat-footer" onsubmit="NyaraChat.handleSend(event)">
                    <input type="text" id="nyara-chat-input" class="nyara-chat-input" placeholder="Type your message..." autocomplete="off" required>
                    <button type="submit" class="nyara-chat-send-btn" title="Send message">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </form>
            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', widgetHtml);

        // Bind launcher & close button
        const launcher = document.getElementById('nyara-chat-launcher');
        const closeBtn = document.getElementById('nyara-chat-close-btn');

        launcher.addEventListener('click', toggleChatBox);
        closeBtn.addEventListener('click', toggleChatBox);
    }

    function toggleChatBox() {
        const box = document.getElementById('nyara-chat-box');
        const badge = document.querySelector('.nyara-chat-badge');
        if (!box) return;

        const isOpening = !box.classList.contains('nyara-open');
        box.classList.toggle('nyara-open');

        if (badge) badge.style.display = 'none';

        if (isOpening && !hasSentOnlineAlert) {
            hasSentOnlineAlert = true;
            sendOnlineAlert();
        }
    }

    // Alert server & owner that user opened live chat
    function sendOnlineAlert() {
        const payload = {
            pageUrl: window.location.href,
            timestamp: new Date().toISOString(),
            device: navigator.userAgent
        };

        fetch('/api/chat-online', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(err => console.log('Online alert ping:', err));
    }

    // Append Message to UI
    function appendMessage(text, isUser = false) {
        const body = document.getElementById('nyara-chat-body');
        if (!body) return;

        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const msgDiv = document.createElement('div');
        msgDiv.className = `nyara-msg ${isUser ? 'nyara-msg-user' : 'nyara-msg-bot'}`;
        msgDiv.innerHTML = `${text}<div class="nyara-msg-time">${timeStr}</div>`;

        body.appendChild(msgDiv);
        body.scrollTop = body.scrollHeight;
    }

    // Show Typing Indicator
    function showTyping() {
        const body = document.getElementById('nyara-chat-body');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'nyara-typing';
        typingDiv.className = 'nyara-typing-indicator';
        typingDiv.innerHTML = '<div class="nyara-typing-dot"></div><div class="nyara-typing-dot"></div><div class="nyara-typing-dot"></div>';
        body.appendChild(typingDiv);
        body.scrollTop = body.scrollHeight;
    }

    function hideTyping() {
        const typing = document.getElementById('nyara-typing');
        if (typing) typing.remove();
    }

    // Send query to backend & Google Sheet "Customer Queries" tab
    function logQueryToSheet(userText, botAnswer) {
        const payload = {
            sheetName: 'Customer Queries',
            name: 'Website Visitor',
            query: userText,
            botAnswer: botAnswer,
            timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            pageUrl: window.location.href
        };

        fetch('/api/chat-query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(err => console.error('Error logging query:', err));
    }

    // Smart Answer Engine
    function generateBotReply(text) {
        const q = text.toLowerCase();

        if (q.includes('product') || q.includes('item') || q.includes('collection') || q.includes('lamp') || q.includes('light') || q.includes('rug') || q.includes('kya kya') || q.includes('saman')) {
            return `✨ <strong>Nyara Luxe Collection:</strong><br>
            - Wall Lamps & Sconces<br>
            - Modern Chandeliers & Pendant Lights<br>
            - Garden & Outdoor Accent Lighting<br>
            - Luxury Rugs, Carpets & Cushion Covers<br><br>
            Explore all items in our <a href="products-grid.html" style="color:#2C3E2E; font-weight:bold; text-decoration:underline;">Products Grid</a>!`;
        }

        if (q.includes('discount') || q.includes('offer') || q.includes('price') || q.includes('off') || q.includes('coupon') || q.includes('rate')) {
            return `🎉 <strong>Special Nyara Luxe Offer:</strong><br>
            Get <strong>20% OFF</strong> on all direct website purchases + <strong>FREE Delivery</strong> across India!<br>
            Simply click <em>"Buy from Nyara Luxe"</em> on any product to unlock the discount immediately.`;
        }

        if (q.includes('delivery') || q.includes('shipping') || q.includes('time') || q.includes('track') || q.includes('kitne din') || q.includes('kab tak')) {
            return `🚚 <strong>Shipping & Delivery Info:</strong><br>
            - Free Shipping across India.<br>
            - Standard delivery takes <strong>3 to 5 business days</strong>.<br>
            - Order confirmation & invoice will be sent directly to your email address!`;
        }

        if (q.includes('contact') || q.includes('email') || q.includes('phone') || q.includes('call') || q.includes('number') || q.includes('address') || q.includes('mail') || q.includes('help') || q.includes('dikat') || q.includes('issue') || q.includes('problem')) {
            return `📞 <strong>Nyara Luxe Customer Support:</strong><br>
            - <strong>Email:</strong> <a href="mailto:info@nyaraluxe.in" style="color:#2C3E2E; font-weight:bold;">info@nyaraluxe.in</a><br>
            - <strong>WhatsApp / Phone:</strong> <a href="https://wa.me/917690082033" target="_blank" style="color:#25D366; font-weight:bold;">+91 7690082033</a><br>
            - <strong>Address:</strong> F-65, Lane 3, Rajouri Garden, New Delhi - 110027.<br><br>
            If you face any issue, mail us at <code>info@nyaraluxe.in</code> or click below to chat live on WhatsApp!`;
        }

        if (q.includes('live') || q.includes('owner') || q.includes('human') || q.includes('person') || q.includes('baat') || q.includes('talk')) {
            return `👤 <strong>Connect 1-on-1 with Live Owner:</strong><br>
            We have alerted our team! You can also click here to chat directly on WhatsApp: <br><br>
            👉 <a href="https://wa.me/917690082033?text=Hi%20Nyara%20Luxe!%20I%20am%20on%20your%20website%20and%20want%20to%20talk%20live." target="_blank" style="display:inline-block; background:#25D366; color:#fff; padding:8px 14px; border-radius:20px; text-decoration:none; font-weight:bold;"><i class="fab fa-whatsapp"></i> Chat Live on WhatsApp</a>`;
        }

        if (q.includes('return') || q.includes('refund') || q.includes('damage') || q.includes('broken')) {
            return `🛡️ <strong>Return & Replacement Policy:</strong><br>
            We offer replacement for any items damaged in transit! Please record an unboxing video and share it with us at <strong>info@nyaraluxe.in</strong> or WhatsApp at <strong>+91 7690082033</strong>.`;
        }

        return `Thank you for your question! 🌿<br><br>
        I have logged your query and notified our team at <strong>info@nyaraluxe.in</strong>. If you need urgent assistance, click the WhatsApp button above to chat 1-on-1 with us directly!`;
    }

    // Expose global controller
    window.NyaraChat = {
        handleFAQ: function (type) {
            let label = '';
            let replyText = '';

            switch (type) {
                case 'products':
                    label = '💡 Products & Collection';
                    replyText = generateBotReply('product');
                    break;
                case 'discounts':
                    label = '💰 20% OFF & Offers';
                    replyText = generateBotReply('discount');
                    break;
                case 'shipping':
                    label = '🚚 Delivery Time';
                    replyText = generateBotReply('delivery');
                    break;
                case 'contact':
                    label = '📧 Contact Support';
                    replyText = generateBotReply('contact');
                    break;
                case 'live':
                    label = '👤 Talk 1-on-1 Live';
                    replyText = generateBotReply('live');
                    break;
            }

            appendMessage(label, true);
            showTyping();

            setTimeout(() => {
                hideTyping();
                appendMessage(replyText, false);
                logQueryToSheet(label, replyText);
            }, 600);
        },

        handleSend: function (e) {
            e.preventDefault();
            const input = document.getElementById('nyara-chat-input');
            const text = input.value.trim();
            if (!text) return;

            input.value = '';
            appendMessage(text, true);
            showTyping();

            const botReply = generateBotReply(text);

            setTimeout(() => {
                hideTyping();
                appendMessage(botReply, false);
                logQueryToSheet(text, botReply);
            }, 800);
        }
    };

    // Auto initialize on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        injectCSS();
        injectWidget();
    });
})();
