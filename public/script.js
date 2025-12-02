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

    // Destroy existing carousel if any
    if (carouselInstance) {
        carouselInstance.destroy();
    }

    // Initialize StaggerCarousel with products
    carouselInstance = new StaggerCarousel('#products-container', {
        autoRotate: false,
        onCardClick: handleProductAction
    });

    carouselInstance.loadProducts(productsToShow);
}

// Handle product actions from carousel
function handleProductAction(product, action) {
    if (action === 'buy') {
        // Show e-commerce modal
        showEcommerceModal(
            product.amazonLink || '',
            product.flipkartLink || '',
            product.meeshoLink || '',
            product.name || 'Product'
        );
    }
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