// script.js - Handle product loading and display for Nyara Luxe website

// DOM Elements
const productsContainer = document.getElementById('products-container');
const filterButtons = document.querySelectorAll('.filter-btn');
const categoryFilter = document.getElementById('category-filter');
const ecommerceModal = document.getElementById('ecommerce-modal');
const closeEcommerceModal = document.getElementById('close-ecommerce-modal');
const ecommercePlatforms = document.getElementById('ecommerce-platforms');
const ecommerceModalTitle = document.getElementById('ecommerce-modal-title');

// Global variables
let allProducts = { categories: {} };
let currentCategory = 'all';
let currentProductForHelp = null; // Track which product the help request is for

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    setupEventListeners();
});

// Load products from API
async function loadProducts() {
    try {
        showLoadingState();
        
        const response = await fetch('/api/products');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        allProducts = await response.json();
        displayProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        showErrorState('Failed to load products. Please try again later.');
    }
}

// Display products based on current filter
function displayProducts() {
    if (!productsContainer) return;
    
    // Clear container
    productsContainer.innerHTML = '';
    
    // Get products to display
    let productsToDisplay = [];
    
    if (currentCategory === 'all') {
        // Combine all products from all categories
        Object.values(allProducts.categories).forEach(categoryProducts => {
            productsToDisplay = productsToDisplay.concat(categoryProducts);
        });
    } else {
        // Get products from specific category
        productsToDisplay = allProducts.categories[currentCategory] || [];
    }
    
    // Display products or show no products message
    if (productsToDisplay.length === 0) {
        productsContainer.innerHTML = `
            <div class="empty-state">
                <h3>No Products Found</h3>
                <p>We couldn't find any products in this category.</p>
            </div>
        `;
        return;
    }
    
    // Create product cards
    productsToDisplay.forEach(product => {
        const productCard = createProductCard(product);
        productsContainer.appendChild(productCard);
    });
    
    // Add event listeners to Buy Now buttons
    document.querySelectorAll('.buy-now-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            openEcommerceModal(productId);
        });
    });
    
    // Add event listeners to Help buttons
    document.querySelectorAll('.help-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            openHelpModal(productId);
        });
    });
    
    // Initialize carousels for all products
    initializeCarousels();
}

// Create a product card element with carousel
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Create carousel HTML if there are multiple media items
    let carouselHTML = '';
    if (product.media && product.media.length > 0) {
        if (product.media.length > 1) {
            // Multiple media items - create carousel
            carouselHTML = `
                <div class="product-carousel">
                    <div class="carousel-container">
                        ${product.media.map((media, index) => `
                            <div class="carousel-slide ${index === 0 ? 'active' : ''}">
                                ${isVideo(media) ? 
                                    `<video autoplay muted loop playsinline>
                                        <source src="${media}" type="video/mp4">
                                        Your browser does not support the video tag.
                                    </video>` :
                                    `<img src="${media}" alt="${product.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0QwQ0JDMiIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkxhdG8iIGZvbnQtc2l6ZT0iMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM0NjRDM0MiPkltYWdlPC90ZXh0Pjwvc3ZnPg=='">`
                                }
                            </div>
                        `).join('')}
                    </div>
                    <button class="carousel-nav carousel-prev" onclick="changeSlide(this.closest('.product-card'), -1)">❮</button>
                    <button class="carousel-nav carousel-next" onclick="changeSlide(this.closest('.product-card'), 1)">❯</button>
                    <div class="carousel-indicators">
                        ${product.media.map((_, index) => `
                            <span class="carousel-indicator ${index === 0 ? 'active' : ''}" onclick="setCurrentSlide(this.closest('.product-card'), ${index})"></span>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            // Single media item
            const media = product.media[0];
            carouselHTML = `
                <div class="product-image">
                    ${isVideo(media) ? 
                        `<video autoplay muted loop playsinline>
                            <source src="${media}" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>` :
                        `<img src="${media}" alt="${product.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0QwQ0JDMiIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkxhdG8iIGZvbnQtc2l6ZT0iMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM0NjRDM0MiPkltYWdlPC90ZXh0Pjwvc3ZnPg=='">`
                    }
                </div>
            `;
        }
    } else {
        // No media items
        carouselHTML = `
            <div class="product-image">
                <div class="no-image-placeholder">No Image</div>
            </div>
        `;
    }
    
    card.innerHTML = `
        ${carouselHTML}
        <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
            ${product.price ? `<div class="product-price">₹${parseFloat(product.price).toLocaleString()}</div>` : ''}
            <div class="product-actions">
                <button class="buy-now-btn" data-id="${product.id}">Buy Now</button>
                <button class="help-btn" data-id="${product.id}">May I Help You?</button>
            </div>
        </div>
    `;
    
    return card;
}

// Check if a media URL is a video
function isVideo(url) {
    return url.includes('.mp4') || url.includes('.mov') || url.includes('.avi') || url.includes('.webm');
}

// Initialize carousels
function initializeCarousels() {
    // Carousels are initialized with the HTML, but we can add any additional setup here if needed
}

// Change slide in carousel
function changeSlide(card, direction) {
    const carousel = card.querySelector('.carousel-container');
    const slides = carousel.querySelectorAll('.carousel-slide');
    const indicators = card.querySelectorAll('.carousel-indicator');
    
    // Find current active slide
    let currentIndex = 0;
    for (let i = 0; i < slides.length; i++) {
        if (slides[i].classList.contains('active')) {
            currentIndex = i;
            break;
        }
    }
    
    // Remove active class from current slide and indicator
    slides[currentIndex].classList.remove('active');
    if (indicators[currentIndex]) {
        indicators[currentIndex].classList.remove('active');
    }
    
    // Calculate new index
    let newIndex = currentIndex + direction;
    if (newIndex >= slides.length) {
        newIndex = 0;
    } else if (newIndex < 0) {
        newIndex = slides.length - 1;
    }
    
    // Add active class to new slide and indicator
    slides[newIndex].classList.add('active');
    if (indicators[newIndex]) {
        indicators[newIndex].classList.add('active');
    }
}

// Set current slide directly
function setCurrentSlide(card, index) {
    const carousel = card.querySelector('.carousel-container');
    const slides = carousel.querySelectorAll('.carousel-slide');
    const indicators = card.querySelectorAll('.carousel-indicator');
    
    // Remove active class from all slides and indicators
    slides.forEach(slide => slide.classList.remove('active'));
    indicators.forEach(indicator => indicator.classList.remove('active'));
    
    // Add active class to selected slide and indicator
    slides[index].classList.add('active');
    indicators[index].classList.add('active');
}

// Set up event listeners
function setupEventListeners() {
    // Filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update category and display products
            currentCategory = this.getAttribute('data-category');
            displayProducts();
        });
    });
    
    // Ecommerce modal
    closeEcommerceModal.addEventListener('click', function() {
        ecommerceModal.classList.remove('show');
    });
    
    // Close modal when clicking outside
    ecommerceModal.addEventListener('click', function(e) {
        if (e.target === ecommerceModal) {
            ecommerceModal.classList.remove('show');
        }
    });
}

// Show loading state
function showLoadingState() {
    if (productsContainer) {
        productsContainer.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading products...</p>
            </div>
        `;
    }
}

// Show error state
function showErrorState(message) {
    if (productsContainer) {
        productsContainer.innerHTML = `
            <div class="error-state">
                <h3>Error Loading Products</h3>
                <p>${message}</p>
                <button class="retry-btn" onclick="loadProducts()">Try Again</button>
            </div>
        `;
    }
}

// Open ecommerce modal
function openEcommerceModal(productId) {
    // Find the product
    let product = null;
    for (const category in allProducts.categories) {
        const foundProduct = allProducts.categories[category].find(p => p.id === productId);
        if (foundProduct) {
            product = foundProduct;
            break;
        }
    }
    
    if (!product) {
        alert('Product not found');
        return;
    }
    
    // Set modal title
    ecommerceModalTitle.textContent = `Buy ${product.name}`;
    
    // Create platform buttons
    ecommercePlatforms.innerHTML = '';
    
    // Add Amazon button if link exists
    if (product.amazonLink) {
        const amazonBtn = document.createElement('a');
        amazonBtn.href = product.amazonLink;
        amazonBtn.target = '_blank';
        amazonBtn.className = 'ecommerce-platform-btn';
        amazonBtn.innerHTML = `
            <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI0ZGOTkwMCIgZD0iTTEyIDIzLjY0Yy02LjQzIDAtMTEuNjQtNS4yMS0xMS42NC0xMS42NFM1LjU3LjM2IDEyIC4zNiAxMjMuNjQgNS41NyAyMy42NCAxMiAyMy42NCAxOC40MyAxOC40MyAyMy42NHoiLz48cGF0aCBmaWxsPSIjRkZGIiBkPSJNMTIgMi4xN2MtNS40IDAtOS43OCA0LjM4LTkuNzggOS43OHM0LjM4IDkuNzggOS43OCA5Ljc4IDkuNzgtNC4zOCA5Ljc4LTkuNzgtNC4zOC05Ljc4LTkuNzgtOS43OHptMy44NiAxMy40M2gtMi4zNXYyLjM1aC0xLjV2LTIuMzVoLTIuMzV2LTEuNWgyLjM1di0yLjM1aDEuNXYyLjM1aDIuMzV2MS41eiIvPjwvc3ZnPg==" alt="Amazon">
            <span>Buy on Amazon</span>
        `;
        ecommercePlatforms.appendChild(amazonBtn);
    }
    
    // Add Flipkart button if link exists
    if (product.flipkartLink) {
        const flipkartBtn = document.createElement('a');
        flipkartBtn.href = product.flipkartLink;
        flipkartBtn.target = '_blank';
        flipkartBtn.className = 'ecommerce-platform-btn';
        flipkartBtn.innerHTML = `
            <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI0ZGOTkwMCIgZD0iTTEyIDIzLjY0Yy02LjQzIDAtMTEuNjQtNS4yMS0xMS42NC0xMS42NFM1LjU3LjM2IDEyIC4zNiAxMjMuNjQgNS41NyAyMy42NCAxMiAyMy42NCAxOC40MyAxOC40MyAyMy42NHoiLz48cGF0aCBmaWxsPSIjRkZGIiBkPSJNMTIgMi4xN2MtNS40IDAtOS43OCA0LjM4LTkuNzggOS43OHM0LjM4IDkuNzggOS43OCA5Ljc4IDkuNzgtNC4zOCA5Ljc4LTkuNzgtNC4zOC05Ljc4LTkuNzgtOS43OHptMy44NiAxMy40M2gtMi4zNXYyLjM1aC0xLjV2LTIuMzVoLTIuMzV2LTEuNWgyLjM1di0yLjM1aDEuNXYyLjM1aDIuMzV2MS41eiIvPjwvc3ZnPg==" alt="Flipkart">
            <span>Buy on Flipkart</span>
        `;
        ecommercePlatforms.appendChild(flipkartBtn);
    }
    
    // Add Meesho button if link exists
    if (product.meeshoLink) {
        const meeshoBtn = document.createElement('a');
        meeshoBtn.href = product.meeshoLink;
        meeshoBtn.target = '_blank';
        meeshoBtn.className = 'ecommerce-platform-btn';
        meeshoBtn.innerHTML = `
            <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI0ZGOTkwMCIgZD0iTTEyIDIzLjY0Yy02LjQzIDAtMTEuNjQtNS4yMS0xMS42NC0xMS42NFM1LjU3LjM2IDEyIC4zNiAxMjMuNjQgNS41NyAyMy42NCAxMiAyMy42NCAxOC40MyAxOC40MyAyMy42NHoiLz48cGF0aCBmaWxsPSIjRkZGIiBkPSJNMTIgMi4xN2MtNS40IDAtOS43OCA0LjM4LTkuNzggOS43OHM0LjM4IDkuNzggOS43OCA5Ljc4IDkuNzgtNC4zOCA5Ljc4LTkuNzgtNC4zOC05Ljc4LTkuNzgtOS43OHptMy44NiAxMy40M2gtMi4zNXYyLjM1aC0xLjV2LTIuMzVoLTIuMzV2LTEuNWgyLjM1di0yLjM1aDEuNXYyLjM1aDIuMzV2MS41eiIvPjwvc3ZnPg==" alt="Meesho">
            <span>Buy on Meesho</span>
        `;
        ecommercePlatforms.appendChild(meeshoBtn);
    }
    
    // Show modal
    ecommerceModal.classList.add('show');
}

// Open help modal for a specific product
function openHelpModal(productId) {
    // Find the product
    let product = null;
    for (const category in allProducts.categories) {
        const foundProduct = allProducts.categories[category].find(p => p.id === productId);
        if (foundProduct) {
            product = foundProduct;
            break;
        }
    }
    
    if (!product) {
        alert('Product not found');
        return;
    }
    
    // Store the current product for the help request
    currentProductForHelp = product;
    
    // Create help modal if it doesn't exist
    let helpModal = document.getElementById('help-modal');
    if (!helpModal) {
        helpModal = document.createElement('div');
        helpModal.id = 'help-modal';
        helpModal.className = 'help-modal';
        helpModal.innerHTML = `
            <div class="help-modal-content">
                <div class="help-modal-header">
                    <h2>How Can We Help You?</h2>
                    <button class="close-help-modal">&times;</button>
                </div>
                <div class="help-modal-body">
                    <div class="help-product-info">
                        <h4>Product: ${product.name}</h4>
                        ${product.sku ? `<p>SKU: ${product.sku}</p>` : ''}
                    </div>
                    <form id="help-form" class="help-form">
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
                        <div id="help-form-message" class="help-form-message"></div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(helpModal);
        
        // Add event listeners
        helpModal.querySelector('.close-help-modal').addEventListener('click', function() {
            helpModal.classList.remove('show');
        });
        
        helpModal.addEventListener('click', function(e) {
            if (e.target === helpModal) {
                helpModal.classList.remove('show');
            }
        });
        
        // Handle form submission
        helpModal.querySelector('#help-form').addEventListener('submit', function(e) {
            e.preventDefault();
            submitHelpRequest();
        });
    } else {
        // Update product info if modal already exists
        const productInfo = helpModal.querySelector('.help-product-info');
        productInfo.innerHTML = `
            <h4>Product: ${product.name}</h4>
            ${product.sku ? `<p>SKU: ${product.sku}</p>` : ''}
        `;
    }
    
    // Show modal
    helpModal.classList.add('show');
    
    // Clear any previous messages
    document.getElementById('help-form-message').className = 'help-form-message';
    document.getElementById('help-form-message').textContent = '';
}

// Submit help request
async function submitHelpRequest() {
    const form = document.getElementById('help-form');
    const name = document.getElementById('help-name').value;
    const email = document.getElementById('help-email').value;
    const query = document.getElementById('help-query').value;
    const messageDiv = document.getElementById('help-form-message');
    
    // Prepare data including product information
    const requestData = {
        name: name,
        email: email,
        query: query
    };
    
    // Add product information if available
    if (currentProductForHelp) {
        requestData.productId = currentProductForHelp.id;
        requestData.productName = currentProductForHelp.name;
        requestData.productSku = currentProductForHelp.sku || null;
    }
    
    try {
        const response = await fetch('/api/help-request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            messageDiv.className = 'help-form-message success';
            messageDiv.textContent = result.message;
            form.reset();
            
            // Hide modal after 2 seconds
            setTimeout(() => {
                document.getElementById('help-modal').classList.remove('show');
            }, 2000);
        } else {
            messageDiv.className = 'help-form-message error';
            messageDiv.textContent = result.message;
        }
    } catch (error) {
        messageDiv.className = 'help-form-message error';
        messageDiv.textContent = 'Sorry, there was an error submitting your query. Please try again.';
    }
}

// Make functions available globally
window.loadProducts = loadProducts;
window.changeSlide = changeSlide;
window.setCurrentSlide = setCurrentSlide;
window.openHelpModal = openHelpModal;