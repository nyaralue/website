const API_BASE = '/api';

let allProducts = {};
let currentCategory = 'all';
let categories = [];

// Load products and categories on page load
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadProducts();
    setupEcommerceModal();
});

// Load categories
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE}/categories`);
        categories = await response.json();
        
        // Add category buttons
        const filterContainer = document.querySelector('.category-filter');
        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.dataset.category = cat.name;
            btn.innerHTML = `<i class="fas ${cat.icon}"></i> ${cat.displayName}`;
            btn.addEventListener('click', () => {
                // Update active state
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update current category
                currentCategory = cat.name;
                displayProducts();
            });
            filterContainer.appendChild(btn);
        });
        
        // Setup "All Products" button
        document.querySelector('.filter-btn[data-category="all"]').addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('.filter-btn[data-category="all"]').classList.add('active');
            currentCategory = 'all';
            displayProducts();
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Load all products
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE}/products`);
        allProducts = await response.json();
        displayProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        showEmptyState('Error loading products. Please try again later.');
    }
}

// Display products in grid
function displayProducts() {
    const container = document.getElementById('products-grid');
    
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
        showEmptyState('No products found in this category.');
        return;
    }
    
    container.innerHTML = productsToShow.map(product => {
        const media = product.media && product.media.length > 0 ? product.media[0] : null;
        const isVideo = media && (media.includes('.mp4') || media.includes('.mov') || media.includes('.avi') || media.includes('.webm'));
        
        let mediaHtml = '';
        if (media) {
            if (isVideo) {
                mediaHtml = `<video src="${media}" autoplay muted loop playsinline></video>`;
            } else {
                mediaHtml = `<img src="${media}" alt="${product.name}">`;
            }
        } else {
            mediaHtml = `<div class="no-image-placeholder" style="display: flex; align-items: center; justify-content: center; height: 100%; background: linear-gradient(135deg, #e8e8e8 0%, #f5f5f5 100%); color: var(--muted-moss); font-size: 3rem;">🏠</div>`;
        }
        
        return `
            <div class="product-grid-card" onclick="showProductModal('${product.id}')">
                <div class="product-grid-image">
                    ${mediaHtml}
                </div>
                <div class="product-grid-info">
                    <div class="product-grid-category">${(product.category || 'Uncategorized').toUpperCase()}</div>
                    <h3 class="product-grid-name">${product.name || 'Product Name'}</h3>
                    ${product.sku ? `<p class="product-grid-sku">SKU: ${product.sku}</p>` : ''}
                    ${product.price ? `<div class="product-grid-price">₹${parseFloat(product.price).toLocaleString()}</div>` : ''}
                    <button class="product-grid-buy-btn" onclick="event.stopPropagation(); showEcommerceModal('${product.amazonLink || ''}', '${product.flipkartLink || ''}', '${product.meeshoLink || ''}', '${product.name || 'Product'}')">
                        Buy Now
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Show empty state
function showEmptyState(message) {
    const container = document.getElementById('products-grid');
    container.innerHTML = `
        <div class="no-products-message" style="grid-column: 1 / -1;">
            <i class="fas fa-box-open"></i>
            <h3>${message}</h3>
        </div>
    `;
}

// Show product modal (for future enhancement)
function showProductModal(productId) {
    // For now, just show the buy modal
    // In future, this could show a detailed product view
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
