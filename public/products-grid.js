import posthog from './posthog.js';

posthog.init('phc_RJThScCLUSlFJOo8ruPWgKcPA4r7RlwKXjYaYa8zsFT',
    {
        api_host: 'https://us.i.posthog.com',
        person_profiles: 'identified_only' // or 'always' to create profiles for anonymous users as well
    }
)

posthog.capture('my event', { property: 'value' })

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

// =======================
// LOAD CATEGORIES
// =======================
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE}/categories`);
        categories = await response.json();

        const filterContainer = document.querySelector('.category-filter');

        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.dataset.category = cat.name;
            btn.innerHTML = `<i class="fas ${cat.icon}"></i> ${cat.displayName}`;

            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                currentCategory = cat.name;

                // 🔥 UMAMI – category view
                umami.track("category_view", {
                    category: cat.name
                });

                displayProducts();
            });

            filterContainer.appendChild(btn);
        });

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

// =======================
// LOAD PRODUCTS
// =======================
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

// =======================
// DISPLAY PRODUCTS
// =======================
function displayProducts() {
    const container = document.getElementById('products-grid');
    if (!container) return;

    let productsToShow = [];

    if (currentCategory === 'all') {
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

   productsToShow.forEach(product => {

    if (!trackedProductViews.has(product._id)) {
        umami.track("view_product", {
            product_id: product._id,
            product_name: product.name,
            category: product.category,
            price: product.price
        });

        trackedProductViews.add(product._id);
    }

});


    container.innerHTML = productsToShow.map(product => {
        const media = product.media && product.media.length > 0 ? product.media[0] : null;
        const isVideo = media && /\.(mp4|mov|avi|webm)$/i.test(media);

        let mediaHtml = '';
        if (media) {
            mediaHtml = isVideo
                ? `<video src="${media}" autoplay muted loop playsinline class="product-media-${product._id}"></video>`
                : `<img src="${media}" alt="${product.name}" class="product-media-${product._id}">`;
        } else {
            mediaHtml = `<div class="no-image-placeholder">🏠</div>`;
        }

        const allMedia = product.media || [];
        const hasMultipleImages = allMedia.length > 1;

        return `
            <div class="product-grid-card">
                <div class="product-grid-image" id="card-image-${product._id}">
                    ${hasMultipleImages ? `
                        <button class="product-carousel-btn prev"
                            onclick="prevCardImage(event, '${product._id}', ${JSON.stringify(allMedia).replace(/"/g, '&quot;')})">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="product-carousel-btn next"
                            onclick="nextCardImage(event, '${product._id}', ${JSON.stringify(allMedia).replace(/"/g, '&quot;')})">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <div class="product-gallery-count" id="count-${product._id}">1/${allMedia.length}</div>
                    ` : ''}
                    ${mediaHtml}
                </div>

                <div class="product-grid-info">
                    <div class="product-grid-category">${(product.category || 'Uncategorized').toUpperCase()}</div>
                    <h3 class="product-grid-name">${product.name}</h3>
                    ${product.sku ? `<p class="product-grid-sku">SKU: ${product.sku}</p>` : ''}
                    ${product.price ? `<div class="product-grid-price">₹${parseFloat(product.price).toLocaleString()}</div>` : ''}

                    <button class="product-grid-buy-btn"
                        onclick="showEcommerceModal(
                            '${product.amazonLink || ''}',
                            '${product.flipkartLink || ''}',
                            '${product.meeshoLink || ''}',
                            '${product.name}'
                        )">
                        Buy Now
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// =======================
// BUY INTENT TRACKING
// =======================
function showEcommerceModal(amazonLink, flipkartLink, meeshoLink, productName) {

    // 🔥 UMAMI – buy intent
    umami.track("product_buy_intent", {
        product_name: productName
    });

    const modal = document.getElementById('ecommerce-modal');
    const modalTitle = document.getElementById('ecommerce-modal-title');
    const platformsContainer = document.getElementById('ecommerce-platforms');

    modalTitle.textContent = `Buy ${productName}`;
    platformsContainer.innerHTML = '';

    if (amazonLink) platformsContainer.innerHTML += `<a href="${amazonLink}" target="_blank">Amazon</a>`;
    if (flipkartLink) platformsContainer.innerHTML += `<a href="${flipkartLink}" target="_blank">Flipkart</a>`;
    if (meeshoLink) platformsContainer.innerHTML += `<a href="${meeshoLink}" target="_blank">Meesho</a>`;

    modal.classList.add('show');
}

// =======================
// UTILITIES
// =======================
function showEmptyState(message) {
    const container = document.getElementById('products-grid');
    container.innerHTML = `<div class="no-products-message">${message}</div>`;
}

function setupEcommerceModal() {
    const modal = document.getElementById('ecommerce-modal');
    const closeBtn = document.getElementById('close-ecommerce-modal');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => modal.classList.remove('show'));
    }

    modal.addEventListener('click', (e) => {
        if (e.target.id === 'ecommerce-modal') modal.classList.remove('show');
    });
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

// Expose functions to window for inline HTML onclick handlers
window.prevCardImage = prevCardImage;
window.nextCardImage = nextCardImage;
window.showEcommerceModal = showEcommerceModal;
window.updateCardImage = updateCardImage;
