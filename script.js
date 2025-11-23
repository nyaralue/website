// Sample product data with Amazon and Flipkart links
let products = [
  {
    id: 1,
    name: "Crystal Chandelier",
    category: "chandeliers",
    description: "Elegant crystal chandelier with brass frame for dining rooms",
    price: 12500,
    image: "💎",
    details: "Height: 60cm, Diameter: 50cm, Material: Crystal & Brass",
    amazonLink: "https://www.amazon.in/chandelier/dp/example1",
    flipkartLink: "https://www.flipkart.com/chandelier/p/example1"
  },
  {
    id: 2,
    name: "Traditional Jhoomar",
    category: "jhoomars",
    description: "Handcrafted traditional jhoomar with intricate detailing",
    price: 8500,
    image: "🏮",
    details: "Height: 45cm, Diameter: 35cm, Material: Metal & Glass",
    amazonLink: "https://www.amazon.in/jhoomar/dp/example2",
    flipkartLink: "https://www.flipkart.com/jhoomar/p/example2"
  },
  {
    id: 3,
    name: "Modern Wall Light",
    category: "wall-lights",
    description: "Contemporary wall light with LED bulbs",
    price: 4200,
    image: "💡",
    details: "Width: 30cm, Projection: 15cm, Material: Stainless Steel",
    amazonLink: "https://www.amazon.in/wall-light/dp/example3",
    flipkartLink: "https://www.flipkart.com/wall-light/p/example3"
  },
  {
    id: 4,
    name: "Marble Table Lamp",
    category: "table-lamps",
    description: "Luxurious marble base table lamp with fabric shade",
    price: 5800,
    image: "🪔",
    details: "Height: 50cm, Base: Marble, Shade: Linen Fabric",
    amazonLink: "https://www.amazon.in/table-lamp/dp/example4",
    flipkartLink: "https://www.flipkart.com/table-lamp/p/example4"
  },
  {
    id: 5,
    name: "Antique Brass Chandelier",
    category: "chandeliers",
    description: "Vintage style brass chandelier with candle lights",
    price: 15600,
    image: "🕯️",
    details: "Height: 70cm, Diameter: 60cm, Material: Antique Brass",
    amazonLink: "https://www.amazon.in/brass-chandelier/dp/example5",
    flipkartLink: "https://www.flipkart.com/brass-chandelier/p/example5"
  },
  {
    id: 6,
    name: "Rajasthani Jhoomar",
    category: "jhoomars",
    description: "Colorful Rajasthani handcrafted jhoomar",
    price: 9200,
    image: "🎨",
    details: "Height: 50cm, Diameter: 40cm, Material: Wood & Glass",
    amazonLink: "https://www.amazon.in/rajasthani-jhoomar/dp/example6",
    flipkartLink: "https://www.flipkart.com/rajasthani-jhoomar/p/example6"
  }
];

let currentProductId = products.length;

// DOM Elements
const productsGrid = document.getElementById('productsGrid');
const categoryFilter = document.getElementById('categoryFilter');
const adminSection = document.getElementById('admin');
const adminNavLink = document.getElementById('adminNavLink');
const adminProductsGrid = document.getElementById('adminProductsGrid');
const productForm = document.getElementById('productForm');
const closeButtons = document.querySelectorAll('.close');
const buyNowModal = document.getElementById('buyNowModal');
const resetFormBtn = document.getElementById('resetForm');

// Tab navigation
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanes = document.querySelectorAll('.tab-pane');

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
  renderProducts(products);
  renderAdminProducts();
  setupEventListeners();
});

// Render products based on filter
function renderProducts(productsToRender) {
  productsGrid.innerHTML = '';
  
  if (productsToRender.length === 0) {
    productsGrid.innerHTML = '<p class="no-products">No products found in this category.</p>';
    return;
  }
  
  productsToRender.forEach(product => {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.innerHTML = `
      <div class="product-image">${product.image}</div>
      <div class="product-info">
        <div class="product-category">${product.category.replace('-', ' ')}</div>
        <h3 class="product-name">${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <div class="product-price">₹${product.price.toLocaleString()}</div>
        <button class="buy-now-btn" data-id="${product.id}">Buy Now</button>
      </div>
    `;
    productsGrid.appendChild(productCard);
  });
  
  // Add event listeners to Buy Now buttons
  document.querySelectorAll('.buy-now-btn').forEach(button => {
    button.addEventListener('click', function() {
      const productId = this.getAttribute('data-id');
      openBuyNowModal(productId);
    });
  });
}

// Filter products by category
categoryFilter.addEventListener('change', function() {
  const selectedCategory = this.value;
  
  if (selectedCategory === 'all') {
    renderProducts(products);
  } else {
    const filteredProducts = products.filter(product => product.category === selectedCategory);
    renderProducts(filteredProducts);
  }
});

// Setup event listeners
function setupEventListeners() {
  // Close modals
  closeButtons.forEach(button => {
    button.addEventListener('click', function() {
      buyNowModal.style.display = 'none';
    });
  });
  
  // Close modals when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === buyNowModal) {
      buyNowModal.style.display = 'none';
    }
  });
  
  // Admin navigation
  adminNavLink.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelectorAll('.main-nav a').forEach(link => link.classList.remove('active'));
    this.classList.add('active');
    document.getElementById('products').style.display = 'none';
    adminSection.style.display = 'block';
  });
  
  // Tab navigation
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const tabId = this.getAttribute('data-tab');
      
      // Update active tab button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Show active tab pane
      tabPanes.forEach(pane => pane.classList.remove('active'));
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });
  
  // Handle product form submission
  productForm.addEventListener('submit', function(e) {
    e.preventDefault();
    saveProduct();
  });
  
  // Reset form
  resetFormBtn.addEventListener('click', function() {
    productForm.reset();
  });
}

// Save product (add or update)
function saveProduct() {
  const productName = document.getElementById('productName').value;
  const productCategory = document.getElementById('productCategory').value;
  const productDescription = document.getElementById('productDescription').value;
  const productPrice = document.getElementById('productPrice').value;
  const productImage = document.getElementById('productImage').value || '🪙';
  const productDetails = document.getElementById('productDetails').value;
  const amazonLink = document.getElementById('amazonLink').value || '#';
  const flipkartLink = document.getElementById('flipkartLink').value || '#';
  
  // In a real app, we would save to a database
  // For now, we'll just add to our array
  const newProduct = {
    id: ++currentProductId,
    name: productName,
    category: productCategory,
    description: productDescription,
    price: parseFloat(productPrice),
    image: productImage,
    details: productDetails,
    amazonLink: amazonLink,
    flipkartLink: flipkartLink
  };
  
  products.push(newProduct);
  renderProducts(products);
  renderAdminProducts();
  
  // Reset form
  productForm.reset();
  alert('Product saved successfully!');
  
  // Switch to manage products tab
  document.querySelector('[data-tab="manage-products"]').click();
}

// Render products in admin panel
function renderAdminProducts() {
  adminProductsGrid.innerHTML = '';
  
  products.forEach(product => {
    const productCard = document.createElement('div');
    productCard.className = 'admin-product-card';
    productCard.innerHTML = `
      <h4>${product.name}</h4>
      <p>Category: ${product.category.replace('-', ' ')}</p>
      <p>Price: ₹${product.price.toLocaleString()}</p>
      <div class="admin-product-actions">
        <button class="edit-btn" data-id="${product.id}">Edit</button>
        <button class="delete-btn" data-id="${product.id}">Delete</button>
      </div>
    `;
    adminProductsGrid.appendChild(productCard);
  });
  
  // Add event listeners to edit and delete buttons
  document.querySelectorAll('.edit-btn').forEach(button => {
    button.addEventListener('click', function() {
      const productId = parseInt(this.getAttribute('data-id'));
      editProduct(productId);
    });
  });
  
  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', function() {
      const productId = parseInt(this.getAttribute('data-id'));
      deleteProduct(productId);
    });
  });
}

// Edit product
function editProduct(productId) {
  const product = products.find(p => p.id === productId);
  
  if (product) {
    // Switch to add product tab
    document.querySelector('[data-tab="add-product"]').click();
    
    // Fill form with product data
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productDescription').value = product.description;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productImage').value = product.image;
    document.getElementById('productDetails').value = product.details;
    document.getElementById('amazonLink').value = product.amazonLink;
    document.getElementById('flipkartLink').value = product.flipkartLink;
    
    // Scroll to form
    document.querySelector('#add-product-tab').scrollIntoView({ behavior: 'smooth' });
  }
}

// Delete product
function deleteProduct(productId) {
  if (confirm('Are you sure you want to delete this product?')) {
    products = products.filter(product => product.id !== productId);
    renderProducts(products);
    renderAdminProducts();
  }
}

// Open Buy Now modal
function openBuyNowModal(productId) {
  const product = products.find(p => p.id === parseInt(productId));
  
  if (product) {
    // Set the links for Amazon and Flipkart
    document.getElementById('amazonLink').href = product.amazonLink;
    document.getElementById('flipkartLink').href = product.flipkartLink;
    
    buyNowModal.style.display = 'block';
  }
}

// Navigation between sections
document.querySelectorAll('.main-nav a:not(#adminNavLink)').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelectorAll('.main-nav a').forEach(l => l.classList.remove('active'));
    this.classList.add('active');
    adminSection.style.display = 'none';
    document.getElementById('products').style.display = 'block';
  });
});