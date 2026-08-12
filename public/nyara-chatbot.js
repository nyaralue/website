// Nyara Luxe Interactive AI Concierge & Automated Query Flow

(function () {
    let hasSentOnlineAlert = false;

    // Chatbot Flow State
    let flowState = {
        step: 0, // 0: Main Menu, 1: Query Details, 2: Name, 3: Contact
        category: '',
        queryText: '',
        userName: '',
        userContact: ''
    };

    // Inject CSS
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
            <!-- Floating Launcher Button -->
            <button id="nyara-chat-launcher" class="nyara-chat-launcher" title="Chat with Nyara Luxe Support">
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
                            <h4 class="nyara-chat-title">Nyara Luxe Support</h4>
                            <span class="nyara-chat-status">
                                <span class="nyara-status-dot"></span> Online | Instant Help
                            </span>
                        </div>
                    </div>
                    <div class="nyara-chat-header-actions">
                        <a href="https://wa.me/917690082033?text=Hi%20Nyara%20Luxe!%20I%20want%20to%20chat%20live." target="_blank" class="nyara-chat-header-btn" title="Chat 1-on-1 on WhatsApp">
                            <i class="fab fa-whatsapp" style="color: #25D366; font-size: 16px;"></i>
                        </a>
                        <button id="nyara-chat-close-btn" class="nyara-chat-header-btn" title="Close Chat">&times;</button>
                    </div>
                </div>

                <!-- Messages Body -->
                <div id="nyara-chat-body" class="nyara-chat-body">
                    <!-- Welcome Msg -->
                    <div class="nyara-msg nyara-msg-bot">
                        👋 Namaste! Welcome to <strong>Nyara Luxe</strong>.<br><br>
                        How can we assist you today? Please select an option below:
                        <div class="nyara-msg-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>

                    <!-- Options Buttons -->
                    <div id="nyara-menu-options" class="nyara-chat-faqs">
                        <button class="nyara-faq-btn" onclick="NyaraChat.selectCategory('Do you have a Query?')">❓ Do you have a Query?</button>
                        <button class="nyara-faq-btn" onclick="NyaraChat.selectCategory('Submit Feedback Form')">📝 Submit Feedback Form</button>
                        <button class="nyara-faq-btn" onclick="NyaraChat.selectCategory('Order in Bulk')">📦 Order in Bulk</button>
                        <button class="nyara-faq-btn" onclick="NyaraChat.selectCategory('Complain About Previous Order')">⚠️ Complain Previous Order</button>
                        <button class="nyara-faq-btn" onclick="NyaraChat.selectCategory('Other')">🌐 Other Query</button>
                        <button class="nyara-faq-btn nyara-btn-wa" onclick="NyaraChat.openWhatsAppDirect()">💬 Chat Live on WhatsApp</button>
                    </div>
                </div>

                <!-- Footer Input -->
                <form id="nyara-chat-form" class="nyara-chat-footer" onsubmit="NyaraChat.handleSend(event)">
                    <input type="text" id="nyara-chat-input" class="nyara-chat-input" placeholder="Type your response here..." autocomplete="off" required>
                    <button type="submit" class="nyara-chat-send-btn" title="Send message">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </form>
            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', widgetHtml);

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

    function sendOnlineAlert() {
        fetch('/api/chat-online', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pageUrl: window.location.href,
                timestamp: new Date().toISOString(),
                device: navigator.userAgent
            })
        }).catch(err => console.log('Online alert:', err));
    }

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

    function hideMenuOptions() {
        const menu = document.getElementById('nyara-menu-options');
        if (menu) menu.style.display = 'none';
    }

    function showSkipButton() {
        const inputForm = document.getElementById('nyara-chat-form');
        let skipBtn = document.getElementById('nyara-skip-btn');
        if (!skipBtn && inputForm) {
            skipBtn = document.createElement('button');
            skipBtn.id = 'nyara-skip-btn';
            skipBtn.type = 'button';
            skipBtn.className = 'nyara-faq-btn';
            skipBtn.style.margin = '4px 0 0 12px';
            skipBtn.style.padding = '4px 10px';
            skipBtn.style.fontSize = '0.75rem';
            skipBtn.textContent = 'Skip this step ➔';
            skipBtn.onclick = function() {
                NyaraChat.handleInput('Not provided (Skipped)');
            };
            inputForm.parentNode.insertBefore(skipBtn, inputForm);
        }
    }

    function removeSkipButton() {
        const skipBtn = document.getElementById('nyara-skip-btn');
        if (skipBtn) skipBtn.remove();
    }

    // Submit Complete Query to Backend (Google Sheet + Email to info@nyaraluxe.in)
    function submitFinalQuery() {
        const payload = {
            sheetName: 'Customer Queries',
            category: flowState.category,
            name: flowState.userName || 'Website Customer',
            contact: flowState.userContact || 'Not provided',
            query: flowState.queryText,
            pageUrl: window.location.href,
            timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        };

        fetch('/api/chat-query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(err => console.error('Submit query error:', err));
    }

    window.NyaraChat = {
        openWhatsAppDirect: function () {
            appendMessage("💬 Chat Live on WhatsApp", true);
            showTyping();
            setTimeout(() => {
                hideTyping();
                const waUrl = "https://wa.me/917690082033?text=" + encodeURIComponent("Hi Nyara Luxe! I want to chat directly with you.");
                appendMessage(`👉 Opened WhatsApp!<br><br><a href="${waUrl}" target="_blank" style="display:inline-block; background:#25D366; color:#FFF; padding:8px 14px; border-radius:20px; text-decoration:none; font-weight:bold;"><i class="fab fa-whatsapp"></i> Click to Open WhatsApp Chat</a>`, false);
                window.open(waUrl, '_blank');
            }, 500);
        },

        selectCategory: function (catName) {
            flowState.category = catName;
            flowState.step = 1;

            hideMenuOptions();
            appendMessage(catName, true);
            showTyping();

            setTimeout(() => {
                hideTyping();
                if (catName === 'Other') {
                    appendMessage("Please specify your query or message in detail:", false);
                } else if (catName === 'Submit Feedback Form') {
                    appendMessage("We value your feedback! Please type your thoughts or review:", false);
                } else if (catName === 'Order in Bulk') {
                    appendMessage("Great! Please describe your bulk order requirements (quantity, product names, location):", false);
                } else if (catName === 'Complain About Previous Order') {
                    appendMessage("We are sorry for any inconvenience! Please describe your issue along with your Order ID or Phone number:", false);
                } else {
                    appendMessage("Please type your question or query below:", false);
                }
            }, 600);
        },

        handleSend: function (e) {
            e.preventDefault();
            const input = document.getElementById('nyara-chat-input');
            const text = input.value.trim();
            if (!text) return;

            input.value = '';
            this.handleInput(text);
        },

        handleInput: function (text) {
            appendMessage(text, true);
            removeSkipButton();
            showTyping();

            setTimeout(() => {
                hideTyping();

                if (flowState.step === 1) {
                    // Query text collected -> Ask Name
                    flowState.queryText = text;
                    flowState.step = 2;
                    appendMessage("Got it! Please enter your <strong>Full Name</strong>:", false);

                } else if (flowState.step === 2) {
                    // Name collected -> Ask Contact
                    flowState.userName = text;
                    flowState.step = 3;
                    showSkipButton();
                    appendMessage(`Thank you <strong>${flowState.userName}</strong>!<br><br>Please enter your <strong>Mobile Number</strong> or <strong>Email Address</strong> (Optional, so we can get back to you):`, false);

                } else if (flowState.step === 3) {
                    // Contact collected -> Complete & Submit
                    flowState.userContact = text;
                    flowState.step = 4;

                    submitFinalQuery();

                    const waLink = `https://wa.me/917690082033?text=` + encodeURIComponent(`Hi Nyara Luxe! My name is ${flowState.userName}. I submitted a query regarding "${flowState.category}": ${flowState.queryText}`);

                    appendMessage(`✅ <strong>Thank you ${flowState.userName}!</strong><br><br>Your query has been logged and emailed directly to <strong>info@nyaraluxe.in</strong>.<br><br>
                    💡 <em>Want to talk to us 1-on-1 right now?</em><br><br>
                    👉 <a href="${waLink}" target="_blank" style="display:inline-block; background:#25D366; color:#FFF; padding:10px 16px; border-radius:20px; text-decoration:none; font-weight:bold;"><i class="fab fa-whatsapp"></i> Chat Live on WhatsApp Now</a>`, false);

                } else {
                    // Reset to Step 1 for new messages
                    flowState.queryText = text;
                    flowState.step = 2;
                    appendMessage("Thank you! Please enter your <strong>Full Name</strong> to update your request:", false);
                }
            }, 700);
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        injectCSS();
        injectWidget();
    });
})();
