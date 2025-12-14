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
                mediaHtml = `<video src="${media}" autoplay muted loop playsinline class="product-media-${product._id}"></video>`;
            } else {
                mediaHtml = `<img src="${media}" alt="${product.name}" class="product-media-${product._id}">`;
            }
        } else {
            mediaHtml = `<div class="no-image-placeholder" style="display: flex; align-items: center; justify-content: center; height: 100%; background: linear-gradient(135deg, #e8e8e8 0%, #f5f5f5 100%); color: var(--muted-moss); font-size: 3rem;">🏠</div>`;
        }

        const allMedia = product.media || [];
        const hasMultipleImages = allMedia.length > 1;

        return `
            <div class="product-grid-card">
                <div class="product-grid-image" id="card-image-${product._id}">
                    ${hasMultipleImages ? `
                        <button class="product-carousel-btn prev" onclick="prevCardImage(event, '${product._id}', ${JSON.stringify(allMedia).replace(/"/g, '&quot;')})"><i class="fas fa-chevron-left"></i></button>
                        <button class="product-carousel-btn next" onclick="nextCardImage(event, '${product._id}', ${JSON.stringify(allMedia).replace(/"/g, '&quot;')})"><i class="fas fa-chevron-right"></i></button>
                        <div class="product-gallery-count" id="count-${product._id}">1/${allMedia.length}</div>
                    ` : ''}
                    
                    ${mediaHtml}
                </div>
                
                <div class="product-grid-info">
                    <div class="product-grid-category">${(product.category || 'Uncategorized').toUpperCase()}</div>
                    <h3 class="product-grid-name">${product.name || 'Product Name'}</h3>
                    ${product.sku ? `<p class="product-grid-sku">SKU: ${product.sku}</p>` : ''}
                    ${product.price ? `<div class="product-grid-price">₹${parseFloat(product.price).toLocaleString()}</div>` : ''}
                    
                    <button class="product-grid-buy-btn" onclick="showEcommerceModal('${product.amazonLink || ''}', '${product.flipkartLink || ''}', '${product.meeshoLink || ''}', '${product.name || 'Product'}')">
                        Buy Now
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Card Carousel Functions
let cardImageIndices = {};

function nextCardImage(event, productId, mediaArray) {
    event.stopPropagation();
    if (!cardImageIndices[productId]) cardImageIndices[productId] = 0;

    cardImageIndices[productId] = (cardImageIndices[productId] + 1) % mediaArray.length;
    updateCardImage(productId, mediaArray);
}

function prevCardImage(event, productId, mediaArray) {
    event.stopPropagation();
    if (!cardImageIndices[productId]) cardImageIndices[productId] = 0;

    cardImageIndices[productId] = (cardImageIndices[productId] - 1 + mediaArray.length) % mediaArray.length;
    updateCardImage(productId, mediaArray);
}

function updateCardImage(productId, mediaArray) {
    const index = cardImageIndices[productId];
    const media = mediaArray[index];
    const isVideo = media && (media.includes('.mp4') || media.includes('.mov') || media.includes('.avi') || media.includes('.webm'));

    const container = document.getElementById(`card-image-${productId}`);
    const count = document.getElementById(`count-${productId}`);

    // Update count
    if (count) count.textContent = `${index + 1}/${mediaArray.length}`;

    // Find existing media element
    const existingImg = container.querySelector('img');
    const existingVideo = container.querySelector('video');
    const existingMedia = existingImg || existingVideo;

    let newMediaElement;

    if (isVideo) {
        newMediaElement = document.createElement('video');
        newMediaElement.src = media;
        newMediaElement.autoplay = true;
        newMediaElement.muted = true;
        newMediaElement.loop = true;
        newMediaElement.playsInline = true;
        newMediaElement.className = `product-media-${productId}`;
    } else {
        newMediaElement = document.createElement('img');
        newMediaElement.src = media;
        newMediaElement.alt = "Product Image";
        newMediaElement.className = `product-media-${productId}`;
    }

    if (existingMedia) {
        container.replaceChild(newMediaElement, existingMedia);
    }
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

// Dark mode removed
