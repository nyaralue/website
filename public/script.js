const API_BASE = '/api';

let allProducts = {};
let currentCategory = 'all';

// Load products on page load
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupCategoryFilters();
    setupDarkMode();
    setupEcommerceModal();
    setupScrollAnimations();
});

// Setup Scroll Animations (Lamp & Fade-in)
function setupScrollAnimations() {
    // Lamp Animation
    const lampContainer = document.querySelector('.scroll-lamp-container');
    const lampBulb = document.querySelector('.lamp-bulb');

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;

        // Toggle lamp on/off based on scroll position
        if (scrollY > 100) {
            document.body.classList.add('lamp-on');
        } else {
            document.body.classList.remove('lamp-on');
        }

        // Parallax/Swing effect for lamp
        if (lampContainer) {
            lampContainer.style.transform = `translateY(${scrollY * 0.1}px) rotate(${Math.sin(scrollY * 0.005) * 5}deg)`;
        }
    });

    // Fade-in on Scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

// Load all products
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE}/products`);
        allProducts = await response.json();
        displayProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        showEmptyState();
    }
}

// Setup category filter buttons
function setupCategoryFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update current category
            currentCategory = btn.dataset.category;
            displayProducts();
        });
    });
}

// Display products based on current filter
function displayProducts() {
    const container = document.getElementById('products-container');

    if (!container) return;

    // Get products to display
    let productsToShow = [];

    if (currentCategory === 'all') {
        // Show all products from all categories
        Object.values(allProducts.categories || {}).forEach(categoryProducts => {
            productsToShow.push(...categoryProducts);
        });
    } else {
        productsToShow = allProducts.categories[currentCategory] || [];
    }

    if (productsToShow.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <h3>No Products Found</h3>
                <p>Check back soon for new additions to our collection.</p>
            </div>
        `;
        return;
    }

    // Render products
    container.innerHTML = productsToShow.map(product => createProductCard(product)).join('');

    // Attach event listeners to Buy Now buttons
    attachBuyNowListeners();
}

// Create product card HTML
function createProductCard(product) {
    // Handle media (images/videos) - support both old 'image' and new 'media' array
    const media = product.media && product.media.length > 0
        ? product.media
        : (product.image ? [product.image] : []);

    let mediaHtml = '';
    if (media.length === 0) {
        mediaHtml = `<div class="product-image-placeholder">🏠</div>`;
    } else if (media.length === 1) {
        const isVideo = media[0].includes('.mp4') || media[0].includes('.mov') || media[0].includes('.avi') || media[0].includes('.webm');
        if (isVideo) {
            mediaHtml = `<video src="${media[0]}" autoplay muted loop playsinline onerror="this.parentElement.innerHTML='<div class=\'product-image-placeholder\'>🏠</div>'"></video>`;
        } else {
            mediaHtml = `<img src="${media[0]}" alt="${product.name}" onerror="this.parentElement.innerHTML='<div class=\'product-image-placeholder\'>🏠</div>'">`;
        }
    } else {
        // Multiple media - create carousel (only show nav if more than 1 item)
        const showNav = media.length > 1;
        mediaHtml = `
            <div class="product-carousel" data-product-id="${product.id}">
                <div class="carousel-container">
                    ${media.map((url, index) => {
            const isVideo = url.includes('.mp4') || url.includes('.mov') || url.includes('.avi') || url.includes('.webm');
            return `
                            <div class="carousel-slide ${index === 0 ? 'active' : ''}">
                                ${isVideo
                    ? `<video src="${url}" autoplay muted loop playsinline></video>`
                    : `<img src="${url}" alt="${product.name}">`
                }
                            </div>
                        `;
        }).join('')}
                </div>
                ${showNav ? `
                    <button class="carousel-nav carousel-prev" onclick="changeCarouselSlide('${product.id}', -1)">‹</button>
                    <button class="carousel-nav carousel-next" onclick="changeCarouselSlide('${product.id}', 1)">›</button>
                    <div class="carousel-indicators">
                        ${media.map((_, index) => `
                            <span class="carousel-indicator ${index === 0 ? 'active' : ''}" onclick="goToCarouselSlide('${product.id}', ${index})"></span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    return `
        <div class="product-card" data-category="${product.category || 'all'}">
            <div class="product-image">
                ${mediaHtml}
            </div>
            <div class="product-info">
                <div class="product-category">${(product.category || 'Uncategorized').toUpperCase()}</div>
                <h3 class="product-name">${product.name || 'Product Name'}</h3>
                <p class="product-description">${product.description || 'Premium interior design piece'}</p>
                ${product.price ? `<div class="product-price">₹${product.price}</div>` : ''}
                <div class="product-actions">
                    <button class="buy-now-btn" 
                        data-product-id="${product.id}" 
                        data-amazon-link="${product.amazonLink || ''}"
                        data-flipkart-link="${product.flipkartLink || ''}"
                        data-meesho-link="${product.meeshoLink || ''}"
                        data-product-name="${product.name || 'Product'}">
                        Buy Now
                    </button>
                    <button class="help-btn" 
                        data-product-id="${product.id}" 
                        data-product-name="${product.name || 'Product'}"
                        data-product-sku="${product.sku || ''}">
                        May I Help?
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Attach Buy Now button listeners
function attachBuyNowListeners() {
    // Buy Now buttons
    const buyButtons = document.querySelectorAll('.buy-now-btn');
    buyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const amazonLink = btn.dataset.amazonLink;
            const flipkartLink = btn.dataset.flipkartLink;
            const meeshoLink = btn.dataset.meeshoLink;
            const productName = btn.dataset.productName;

            // Show ecommerce platform selection modal - only show platforms with links
            showEcommerceModal(amazonLink, flipkartLink, meeshoLink, productName);
        });
    });

    // Help buttons
    const helpButtons = document.querySelectorAll('.help-btn');
    helpButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = btn.dataset.productId;
            const productName = btn.dataset.productName;
            const productSku = btn.dataset.productSku;

            // Show help form modal
            showHelpFormModal(productId, productName, productSku);
        });
    });
}

// Carousel functions
window.changeCarouselSlide = function (productId, direction) {
    const carousel = document.querySelector(`.product-carousel[data-product-id="${productId}"]`);
    if (!carousel) return;

    const slides = carousel.querySelectorAll('.carousel-slide');
    const indicators = carousel.querySelectorAll('.carousel-indicator');
    let currentIndex = Array.from(slides).findIndex(slide => slide.classList.contains('active'));

    slides[currentIndex].classList.remove('active');
    indicators[currentIndex].classList.remove('active');

    currentIndex += direction;
    if (currentIndex < 0) currentIndex = slides.length - 1;
    if (currentIndex >= slides.length) currentIndex = 0;

    slides[currentIndex].classList.add('active');
    indicators[currentIndex].classList.add('active');
};

window.goToCarouselSlide = function (productId, index) {
    const carousel = document.querySelector(`.product-carousel[data-product-id="${productId}"]`);
    if (!carousel) return;

    const slides = carousel.querySelectorAll('.carousel-slide');
    const indicators = carousel.querySelectorAll('.carousel-indicator');

    slides.forEach(slide => slide.classList.remove('active'));
    indicators.forEach(indicator => indicator.classList.remove('active'));

    slides[index].classList.add('active');
    indicators[index].classList.add('active');
};

// Show ecommerce platform selection modal
function showEcommerceModal(amazonLink, flipkartLink, meeshoLink, productName) {
    const modal = document.getElementById('ecommerce-modal');
    const modalTitle = document.getElementById('ecommerce-modal-title');
    const platformsContainer = document.getElementById('ecommerce-platforms');

    modalTitle.textContent = `Buy ${productName}`;

    // Clear previous platforms
    platformsContainer.innerHTML = '';

    let hasLinks = false;

    // Add Amazon if available
    if (amazonLink) {
        hasLinks = true;
        const amazonBtn = document.createElement('a');
        amazonBtn.href = amazonLink;
        amazonBtn.target = '_blank';
        amazonBtn.className = 'ecommerce-platform-btn';
        amazonBtn.innerHTML = `
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon" onerror="this.outerHTML='<span>Buy on Amazon</span>'">
            <span>Buy on Amazon</span>
        `;
        platformsContainer.appendChild(amazonBtn);
    }

    // Add Flipkart if available
    if (flipkartLink) {
        hasLinks = true;
        const flipkartBtn = document.createElement('a');
        flipkartBtn.href = flipkartLink;
        flipkartBtn.target = '_blank';
        flipkartBtn.className = 'ecommerce-platform-btn';
        flipkartBtn.innerHTML = `
            <img src="https://static-assets-web.flixcart.com/www/linchpin/fk-cp-zion/img/flipkart-plus_8d85f4.png" alt="Flipkart" onerror="this.outerHTML='<span>Buy on Flipkart</span>'">
            <span>Buy on Flipkart</span>
        `;
        platformsContainer.appendChild(flipkartBtn);
    }

    // Add Meesho if available
    if (meeshoLink) {
        hasLinks = true;
        const meeshoBtn = document.createElement('a');
        meeshoBtn.href = meeshoLink;
        meeshoBtn.target = '_blank';
        meeshoBtn.className = 'ecommerce-platform-btn';
        meeshoBtn.innerHTML = `
            <img src="https://images.meesho.com/images/pow/meesho-logo.png" alt="Meesho" onerror="this.outerHTML='<span>Buy on Meesho</span>'">
            <span>Buy on Meesho</span>
        `;
        platformsContainer.appendChild(meeshoBtn);
    }

    // If no links available
    if (!hasLinks) {
        platformsContainer.innerHTML = '<p style="color: var(--text-secondary);">No purchase links available. Please contact us for orders.</p>';
    }

    modal.classList.add('show');
}

// Setup ecommerce modal
function setupEcommerceModal() {
    const modal = document.getElementById('ecommerce-modal');
    const closeBtn = document.getElementById('close-ecommerce-modal');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });
    }

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target.id === 'ecommerce-modal') {
            modal.classList.remove('show');
        }
    });
}

// Dark mode functionality
function setupDarkMode() {
    const themeToggle = document.getElementById('theme-toggle-checkbox');

    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (themeToggle) themeToggle.checked = true;
    }

    // Toggle theme
    if (themeToggle) {
        themeToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light');
            }
        });
    }
}

// Show empty state
function showEmptyState() {
    const container = document.getElementById('products-container');
    if (container) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <h3>Loading Products...</h3>
                <p>Please wait while we load our collection.</p>
            </div>
        `;
    }
}

// Show help form modal
function showHelpFormModal(productId, productName, productSku) {
    // Create or update the help modal
    let helpModal = document.getElementById('help-modal');
    if (!helpModal) {
        helpModal = document.createElement('div');
        helpModal.id = 'help-modal';
        helpModal.className = 'help-modal';
        helpModal.innerHTML = `
            <div class="help-modal-content">
                <button class="close-help-modal">&times;</button>
                <h3>Need Help with This Product?</h3>
                <div class="help-product-info">
                    <h4 id="help-product-name"></h4>
                </div>
                <form id="help-form" class="help-form">
                    <input type="hidden" id="help-product-id" name="productId">
                    <input type="hidden" id="help-product-sku-hidden" name="productSku">
                    <div class="form-group">
                        <label for="help-name">Your Name *</label>
                        <input type="text" id="help-name" name="name" required>
                    </div>
                    <div class="form-group">
                        <label for="help-email">Email Address *</label>
                        <input type="email" id="help-email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="help-query">Your Query *</label>
                        <textarea id="help-query" name="query" rows="4" required></textarea>
                    </div>
                    <button type="submit" class="submit-help-btn">Submit Query</button>
                </form>
                <div id="help-form-message" class="help-form-message"></div>
            </div>
        `;
        document.body.appendChild(helpModal);

        // Add event listeners
        helpModal.querySelector('.close-help-modal').addEventListener('click', () => {
            helpModal.style.display = 'none';
        });

        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                helpModal.style.display = 'none';
            }
        });

        // Form submission
        helpModal.querySelector('#help-form').addEventListener('submit', submitHelpForm);
    }

    // Populate form with product info
    document.getElementById('help-product-id').value = productId;
    document.getElementById('help-product-sku-hidden').value = productSku; // Hidden SKU field
    document.getElementById('help-product-name').textContent = productName;

    // Reset form and message
    document.getElementById('help-form').reset();
    document.getElementById('help-form-message').textContent = '';
    document.getElementById('help-form-message').className = 'help-form-message';

    // Show modal
    helpModal.style.display = 'flex';
}

// Submit help form
async function submitHelpForm(e) {
    e.preventDefault();

    const form = e.target;
    const messageDiv = document.getElementById('help-form-message');
    const submitBtn = form.querySelector('.submit-help-btn');

    // Get form data
    const formData = new FormData(form);
    const data = {
        productId: formData.get('productId'),
        productName: document.getElementById('help-product-name').textContent,
        productSku: formData.get('productSku'), // Get SKU from hidden field
        name: formData.get('name'),
        email: formData.get('email'),
        query: formData.get('query'),
        timestamp: new Date().toISOString()
    };

    // Disable submit button and show loading
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    messageDiv.textContent = '';
    messageDiv.className = 'help-form-message';

    try {
        // Send data to server
        const response = await fetch('/api/help-request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Show success message
            messageDiv.textContent = result.message;
            messageDiv.className = 'help-form-message success';

            // Reset form after success
            form.reset();

            // Close modal after delay
            setTimeout(() => {
                document.getElementById('help-modal').style.display = 'none';
            }, 3000);
        } else {
            throw new Error(result.message || 'Failed to submit query');
        }
    } catch (error) {
        console.error('Error submitting help form:', error);
        messageDiv.textContent = error.message || 'Sorry, there was an error submitting your query. Please try again.';
        messageDiv.className = 'help-form-message error';
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Query';
    }
}

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

