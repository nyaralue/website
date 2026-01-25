const API_BASE = '/api';

let allProducts = {};
let currentCategory = 'all';
let categories = [];

// Load products on page load
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadProducts();
    setupEcommerceModal();
    setupScrollAnimations();
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
            mediaHtml = `<div class="no-image-placeholder" style="display: flex; align-items: center; justify-content: center; height: 100%; background: linear-gradient(135deg, #e8e8e8 0%, #f5f5f5 100%); color: var(--muted-moss); font-size: 3rem;"><i class="fas fa-lightbulb"></i></div>`;
        }

        const allMedia = product.media || [];
        const hasMultipleImages = allMedia.length > 1;
        const productDetailUrl = `product.html?id=${product.id || product._id}`;

        return `
            <div class="product-grid-card" data-testid="product-card-${product.id || product._id}">
                <a href="${productDetailUrl}" class="product-grid-image-link">
                    <div class="product-grid-image" id="card-image-${product._id}">
                        ${hasMultipleImages ? `
                            <button class="product-carousel-btn prev" onclick="event.preventDefault(); prevCardImage(event, '${product._id}', ${JSON.stringify(allMedia).replace(/"/g, '&quot;')})"><i class="fas fa-chevron-left"></i></button>
                            <button class="product-carousel-btn next" onclick="event.preventDefault(); nextCardImage(event, '${product._id}', ${JSON.stringify(allMedia).replace(/"/g, '&quot;')})"><i class="fas fa-chevron-right"></i></button>
                            <div class="product-gallery-count" id="count-${product._id}">1/${allMedia.length}</div>
                        ` : ''}
                        
                        ${mediaHtml}
                    </div>
                </a>
                
                <div class="product-grid-info">
                    <div class="product-grid-category">${(product.category || 'Uncategorized').toUpperCase()}</div>
                    <a href="${productDetailUrl}" class="product-name-link">
                        <h3 class="product-grid-name">${product.name || 'Product Name'}</h3>
                    </a>
                    ${product.sku ? `<p class="product-grid-sku">SKU: ${product.sku}</p>` : ''}
                    ${product.price ? `<div class="product-grid-price">₹${parseFloat(product.price).toLocaleString()}</div>` : ''}
                    
                    <div class="product-grid-actions">
                        <a href="${productDetailUrl}" class="product-view-btn" data-testid="view-details-${product.id || product._id}">
                            View Details
                        </a>
                        <button class="product-grid-buy-btn" onclick="showEcommerceModal('${product.amazonLink || ''}', '${product.flipkartLink || ''}', '${product.meeshoLink || ''}', '${product.name || 'Product'}')" data-testid="buy-now-${product.id || product._id}">
                            Buy Now
                        </button>
                    </div>
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
    const container = document.getElementById('products-container');
    container.innerHTML = `
        <div class="no-products-message" style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; color: var(--text-secondary);">
            <i class="fas fa-box-open" style="font-size: 4rem; color: var(--muted-moss); margin-bottom: 1rem; display: block;"></i>
            <h3>${message}</h3>
        </div>
    `;
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

function setupScrollAnimations() {
    // Simple scroll animation for elements
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.product-grid-card, .section-title').forEach(el => {
        el.classList.add('fade-in-up');
        observer.observe(el);
    });
}

// Product Image Gallery
let currentGalleryIndex = 0;
let currentGalleryMedia = [];

function initProductGallery(event, mediaArray) {
    event.stopPropagation();
    currentGalleryMedia = mediaArray;
    currentGalleryIndex = 0;
    showGalleryModal();
}

function showGalleryModal() {
    // Create modal if doesn't exist
    let modal = document.getElementById('gallery-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'gallery-modal';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 10000; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s;';
        modal.innerHTML = `
            <button onclick="closeGalleryModal()" style="position: absolute; top: 20px; right: 20px; width: 40px; height: 40px; background: white; border: none; border-radius: 50%; font-size: 1.5rem; cursor: pointer; z-index: 2;">&times;</button>
            <div style="position: relative; max-width: 90%; max-height: 90%; display: flex; align-items: center; justify-content: center;">
                <button onclick="previousGalleryImage()" class="product-gallery-arrow" style="position: absolute; left: -50px; width: 40px; height: 40px;"><i class="fas fa-chevron-left"></i></button>
                <div id="gallery-content" style="max-width: 800px; max-height: 600px; display: flex; align-items: center; justify-content: center;"></div>
                <button onclick="nextGalleryImage()" class="product-gallery-arrow" style="position: absolute; right: -50px; width: 40px; height: 40px;"><i class="fas fa-chevron-right"></i></button>
            </div>
            <div id="gallery-indicators" style="position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px;"></div>
        `;
        document.body.appendChild(modal);
    }

    updateGalleryContent();
    modal.style.display = 'flex';
    setTimeout(() => modal.style.opacity = '1', 10);
}

function closeGalleryModal() {
    const modal = document.getElementById('gallery-modal');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => modal.style.display = 'none', 300);
    }
}

function updateGalleryContent() {
    const content = document.getElementById('gallery-content');
    const indicators = document.getElementById('gallery-indicators');
    const media = currentGalleryMedia[currentGalleryIndex];
    const isVideo = media && (media.includes('.mp4') || media.includes('.mov') || media.includes('.avi') || media.includes('.webm'));

    if (isVideo) {
        content.innerHTML = `<video src="${media}" controls autoplay style="max-width: 100%; max-height: 100%; border-radius: 8px;">`;
    } else {
        content.innerHTML = `<img src="${media}" style="max-width: 100%; max-height: 100%; border-radius: 8px;">`;
    }

    // Update indicators
    indicators.innerHTML = currentGalleryMedia.map((_, i) =>
        `<div class="product-gallery-dot ${i === currentGalleryIndex ? 'active' : ''}" onclick="goToGalleryImage(${i})"></div>`
    ).join('');
}

function previousGalleryImage() {
    currentGalleryIndex = (currentGalleryIndex - 1 + currentGalleryMedia.length) % currentGalleryMedia.length;
    updateGalleryContent();
}

function nextGalleryImage() {
    currentGalleryIndex = (currentGalleryIndex + 1) % currentGalleryMedia.length;
    updateGalleryContent();
}

function goToGalleryImage(index) {
    currentGalleryIndex = index;
    updateGalleryContent();
}
