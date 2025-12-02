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

// Carousel instance
let carouselInstance = null;

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

    // Setup Staggered Carousel
    setupStaggeredCarousel(container, productsToShow);
}

function setupStaggeredCarousel(container, products) {
    // Clear container and set class
    container.innerHTML = '';
    container.className = 'staggered-carousel-container';

    // Initialize state
    // Add tempId for tracking
    carouselState.products = products.map((p, i) => ({ ...p, tempId: i }));

    // Create card elements
    carouselState.products.forEach((product) => {
        const card = createCarouselCard(product);
        container.appendChild(card);
    });

    // Add controls
    const controls = document.createElement('div');
    controls.className = 'carousel-controls';
    controls.innerHTML = `
        <button class="carousel-btn prev-btn" aria-label="Previous"><i class="fas fa-chevron-left"></i></button>
        <button class="carousel-btn next-btn" aria-label="Next"><i class="fas fa-chevron-right"></i></button>
    `;
    container.appendChild(controls);

    // Add event listeners
    controls.querySelector('.prev-btn').addEventListener('click', () => moveCarousel(-1));
    controls.querySelector('.next-btn').addEventListener('click', () => moveCarousel(1));

    // Initial render
    updateCarouselPositions();

    // Handle resize
    window.addEventListener('resize', () => {
        carouselState.cardSize = window.innerWidth < 640 ? 280 : 320;
        updateCarouselPositions();
    });
}

function createCarouselCard(product) {
    const card = document.createElement('div');
    card.className = 'carousel-card';
    card.dataset.id = product.tempId;

    // Handle media
    const media = product.media && product.media.length > 0
        ? product.media
        : (product.image ? [product.image] : []);

    let mediaHtml = '';
    if (media.length > 0) {
        const isVideo = media[0].includes('.mp4') || media[0].includes('.mov') || media[0].includes('.avi') || media[0].includes('.webm');
        if (isVideo) {
            mediaHtml = `<video src="${media[0]}" autoplay muted loop playsinline></video>`;
        } else {
            mediaHtml = `<img src="${media[0]}" alt="${product.name}">`;
        }
    } else {
        mediaHtml = `<div class="product-image-placeholder">🏠</div>`;
    }

    card.innerHTML = `
        <span class="carousel-card-line"></span>
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
                    Help
                </button>
            </div>
        </div>
    `;

    return card;
}

function moveCarousel(steps) {
    if (steps > 0) {
        // Move forward (Next)
        for (let i = 0; i < steps; i++) {
            const item = carouselState.products.shift();
            carouselState.products.push(item);
        }
    } else {
        // Move backward (Prev)
        for (let i = 0; i < Math.abs(steps); i++) {
            const item = carouselState.products.pop();
            carouselState.products.unshift(item);
        }
    }
    updateCarouselPositions();
}

function updateCarouselPositions() {
    const container = document.querySelector('.staggered-carousel-container');
    if (!container) return;

    const total = carouselState.products.length;

    carouselState.products.forEach((product, index) => {
        const card = container.querySelector(`.carousel-card[data-id="${product.tempId}"]`);
        if (!card) return;

        // Calculate position relative to center
        const centerIndex = Math.floor(total / 2);
        let dist = index - centerIndex;

        const isCenter = dist === 0;

        // Styles based on Staggered Testimonials design
        const cardSize = carouselState.cardSize;

        // Transform logic from user request:
        // translateX(${(cardSize / 1.5) * position}px)
        // translateY(${isCenter ? -65 : position % 2 ? 15 : -15}px)
        // rotate(${isCenter ? 0 : position % 2 ? 2.5 : -2.5}deg)

        const x = (cardSize / 1.5) * dist;
        const y = isCenter ? -65 : (Math.abs(dist) % 2 === 1 ? 15 : -15);
        const rotate = isCenter ? 0 : (Math.abs(dist) % 2 === 1 ? 2.5 : -2.5);

        const zIndex = isCenter ? 100 : 100 - Math.abs(dist);
        const opacity = Math.abs(dist) > 2 ? 0 : 1;
        const pointerEvents = isCenter ? 'auto' : 'none';

        card.style.transform = `translate(-50%, -50%) translateX(${x}px) translateY(${y}px) rotate(${rotate}deg)`;
        card.style.zIndex = zIndex;
        card.style.opacity = opacity;
        card.style.pointerEvents = pointerEvents;

        if (isCenter) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });

    attachBuyNowListeners();
}

// Attach Buy Now button listeners
function attachBuyNowListeners() {
    // Buy Now buttons
    const buyButtons = document.querySelectorAll('.buy-now-btn');
    buyButtons.forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation(); // Prevent card click
            const amazonLink = btn.dataset.amazonLink;
            const flipkartLink = btn.dataset.flipkartLink;
            const meeshoLink = btn.dataset.meeshoLink;
            const productName = btn.dataset.productName;
            showEcommerceModal(amazonLink, flipkartLink, meeshoLink, productName);
        };
    });

    // Help buttons
    const helpButtons = document.querySelectorAll('.help-btn');
    helpButtons.forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const productId = btn.dataset.productId;
            const productName = btn.dataset.productName;
            const productSku = btn.dataset.productSku;
            showHelpFormModal(productId, productName, productSku);
        };
    });
}

// Show ecommerce platform selection modal
function showEcommerceModal(amazonLink, flipkartLink, meeshoLink, productName) {
    const modal = document.getElementById('ecommerce-modal');
    const modalTitle = document.getElementById('ecommerce-modal-title');
    const platformsContainer = document.getElementById('ecommerce-platforms');

    modalTitle.textContent = `Buy ${productName}`;
    platformsContainer.innerHTML = '';

    let hasLinks = false;

    if (amazonLink) {
        hasLinks = true;
        const amazonBtn = document.createElement('a');
        amazonBtn.href = amazonLink;
        amazonBtn.target = '_blank';
        amazonBtn.className = 'ecommerce-platform-btn';
        amazonBtn.innerHTML = `<span>Buy on Amazon</span>`;
        platformsContainer.appendChild(amazonBtn);
    }

    if (flipkartLink) {
        hasLinks = true;
        const flipkartBtn = document.createElement('a');
        flipkartBtn.href = flipkartLink;
        flipkartBtn.target = '_blank';
        flipkartBtn.className = 'ecommerce-platform-btn';
        flipkartBtn.innerHTML = `<span>Buy on Flipkart</span>`;
        platformsContainer.appendChild(flipkartBtn);
    }

    if (meeshoLink) {
        hasLinks = true;
        const meeshoBtn = document.createElement('a');
        meeshoBtn.href = meeshoLink;
        meeshoBtn.target = '_blank';
        meeshoBtn.className = 'ecommerce-platform-btn';
        meeshoBtn.innerHTML = `<span>Buy on Meesho</span>`;
        platformsContainer.appendChild(meeshoBtn);
    }

    if (!hasLinks) {
        platformsContainer.innerHTML = '<p style="color: var(--text-secondary);">No purchase links available.</p>';
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

    modal.addEventListener('click', (e) => {
        if (e.target.id === 'ecommerce-modal') {
            modal.classList.remove('show');
        }
    });
}

// Dark mode functionality
function setupDarkMode() {
    const themeToggle = document.getElementById('theme-toggle-checkbox');
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (themeToggle) themeToggle.checked = true;
    }

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

        helpModal.querySelector('.close-help-modal').addEventListener('click', () => {
            helpModal.style.display = 'none';
        });

        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                helpModal.style.display = 'none';
            }
        });

        const form = helpModal.querySelector('#help-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            const messageDiv = document.getElementById('help-form-message');

            messageDiv.textContent = 'Sending...';
            messageDiv.className = 'help-form-message';

            try {
                const response = await fetch(`${API_BASE}/help-request`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    messageDiv.textContent = 'Query sent successfully! We will contact you soon.';
                    messageDiv.classList.add('success');
                    form.reset();
                    setTimeout(() => {
                        helpModal.style.display = 'none';
                        messageDiv.textContent = '';
                        messageDiv.classList.remove('success');
                    }, 2000);
                } else {
                    throw new Error(result.message || 'Failed to send query');
                }
            } catch (error) {
                console.error('Error sending help query:', error);
                messageDiv.textContent = 'Error: ' + error.message;
                messageDiv.classList.add('error');
            }
        });
    }

    document.getElementById('help-product-name').textContent = productName;
    document.getElementById('help-product-id').value = productId;
    document.getElementById('help-product-sku-hidden').value = productSku || '';

    helpModal.style.display = 'flex';
}

function setupScrollAnimations() {
    // Simple scroll animation for elements
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.product-card, .section-title').forEach(el => {
        el.classList.add('fade-in-up');
        observer.observe(el);
    });
}