const API_BASE = '/api';

let allProducts = {};
let currentCategory = 'all';
let categories = [];

// 🔥 Track product views only once per session
let trackedProductViews = new Set();

// =======================
// PAGE LOAD
// =======================
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
                if (window.umami) {
                    umami.track("category_view", { category: cat.name });
                }

                displayProducts();
            });

            filterContainer.appendChild(btn);
        });

        const allBtn = document.querySelector('.filter-btn[data-category="all"]');
        if (allBtn) {
            allBtn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                allBtn.classList.add('active');
                currentCategory = 'all';
                displayProducts();
            });
        }

    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// =======================
// LOAD PRODUCTS (ANALYTICS HERE – SAFE PLACE)
// =======================
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE}/products`);
        allProducts = await response.json();

        // 🔥 UMAMI – product view (ONLY ONCE PER PRODUCT)
        Object.values(allProducts.categories || {}).forEach(categoryProducts => {
            categoryProducts.forEach(product => {
                if (!trackedProductViews.has(product._id)) {
                    if (window.umami) {
                        umami.track("view_product", {
                            product_id: product._id,
                            product_name: product.name,
                            category: product.category,
                            price: product.price
                        });
                    }
                    trackedProductViews.add(product._id);
                }
            });
        });

        displayProducts();

    } catch (error) {
        console.error('Error loading products:', error);
        showEmptyState('Error loading products. Please try again later.');
    }
}

// =======================
// DISPLAY PRODUCTS (UI ONLY)
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

    container.innerHTML = productsToShow.map(product => {
        const media = product.media?.[0];
        const isVideo = media && /\.(mp4|mov|avi|webm)$/i.test(media);

        const mediaHtml = media
            ? (isVideo
                ? `<video src="${media}" autoplay muted loop playsinline></video>`
                : `<img src="${media}" alt="${product.name}">`)
            : `<div class="no-image-placeholder">🏠</div>`;

        return `
            <div class="product-grid-card">
                <div class="product-grid-image">
                    ${mediaHtml}
                </div>

                <div class="product-grid-info">
                    <div class="product-grid-category">${(product.category || '').toUpperCase()}</div>
                    <h3 class="product-grid-name">${product.name}</h3>
                    ${product.price ? `<div class="product-grid-price">₹${Number(product.price).toLocaleString()}</div>` : ''}

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
    if (window.umami) {
        umami.track("product_buy_intent", { product_name: productName });
    }

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

    modal.addEventListener('click', e => {
        if (e.target.id === 'ecommerce-modal') modal.classList.remove('show');
    });
}
