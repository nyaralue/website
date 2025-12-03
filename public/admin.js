const API_BASE = '/api';

let authToken = null;
let currentCategory = 'jhoomar';
let products = [];
let editingProductId = null;
let uploadedFiles = [];
let cropper = null;
let currentCropFile = null;
let imageFilesToCrop = []; // All images selected for cropping
let currentCropIndex = 0; // Current image index in carousel
let croppedImages = []; // Store cropped images

// Global variable to store all products
let allProducts = {};

// Always show login screen first - no auto-login
showLoginScreen();

// Login form handler
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');
    
    try {
        const response = await fetch(`${API_BASE}/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            showAdminPanel();
        } else {
            errorDiv.textContent = data.error || 'Login failed';
            errorDiv.classList.add('show');
        }
    } catch (error) {
        errorDiv.textContent = 'Network error. Please try again.';
        errorDiv.classList.add('show');
    }
});

// Logout handler
document.getElementById('logout-btn').addEventListener('click', () => {
    authToken = null;
    localStorage.removeItem('authToken');
    showLoginScreen();
});

// Category dropdown handler - removed since we're using tabs now

// Add product button
document.getElementById('add-product-btn').addEventListener('click', () => {
    editingProductId = null;
    uploadedFiles = [];
    openProductModal();
});

// File upload handlers
document.getElementById('select-files-btn').addEventListener('click', () => {
    document.getElementById('file-input').click();
});

document.getElementById('file-input').addEventListener('change', handleFileSelect);

// Improved cropper handlers
document.getElementById('close-cropper').addEventListener('click', closeCropper);
document.getElementById('cancel-crop').addEventListener('click', closeCropper);
document.getElementById('apply-crop').addEventListener('click', applyCrop);
document.getElementById('skip-crop').addEventListener('click', skipCurrentCrop);
document.getElementById('done-crop').addEventListener('click', finishCroppingAndUpload);

// Close modal handlers
document.getElementById('close-modal').addEventListener('click', closeProductModal);
document.getElementById('cancel-btn').addEventListener('click', closeProductModal);

// Product form handler with improved error handling
document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorDiv = document.getElementById('form-error');
    errorDiv.classList.remove('show');
    errorDiv.textContent = '';
    
    try {
        // Show loading state
        const saveBtn = document.querySelector('.save-btn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;
        
        // Separate existing media URLs from new files to upload
        let mediaUrls = [];
        const newFilesToUpload = [];

        if (uploadedFiles && uploadedFiles.length > 0) { uploadedFiles.forEach(file => {
            if (file.isExisting && file.url) {
                // This is an existing URL, keep it
                mediaUrls.push(file.url);
            } else {
                // This is a new file to upload
                newFilesToUpload.push(file); } }); }

        // Upload new files if any
        if (newFilesToUpload.length > 0) {
            const uploadFormData = new FormData();
            newFilesToUpload.forEach((file) => {
                uploadFormData.append('files', file);
            });

            const uploadResponse = await fetch(`${API_BASE}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                body: uploadFormData
            });

            if (uploadResponse.ok) {
                const uploadData = await uploadResponse.json();
                mediaUrls = [...mediaUrls, ...uploadData.urls];
            } else {
                const errorData = await uploadResponse.json();
                throw new Error(errorData.error || 'Failed to upload files');
            }
        }

        const formData = new FormData(e.target);
        const product = {
            name: formData.get('name'),
            sku: formData.get('sku'),
            description: formData.get('description'),
            price: formData.get('price') ? parseFloat(formData.get('price')) : null,
            media: mediaUrls,
            amazonLink: formData.get('amazonLink') || null,
            flipkartLink: formData.get('flipkartLink') || null,
            meeshoLink: formData.get('meeshoLink') || null,
            category: currentCategory
        };
        
        let response;
        let data;
        
        if (editingProductId) {
            // Update existing product
            response = await fetch(`${API_BASE}/products/${currentCategory}/${editingProductId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(product)
            });
        } else {
            // Add new product
            response = await fetch(`${API_BASE}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ category: currentCategory, product })
            });
        }
        
        // Check if response is ok
        if (response.ok) {
            data = await response.json();
            closeProductModal();
            loadProducts();
            
            // Show success message
            showNotification(data.message || 'Product saved successfully!', 'success');
        } else {
            // Handle error response
            try {
                data = await response.json();
                throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
            } catch (jsonError) {
                // If JSON parsing fails, use the status text
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        }
    } catch (error) {
        console.error('Error saving product:', error);
        errorDiv.textContent = error.message || 'Network error. Please check your connection and try again.';
        errorDiv.classList.add('show');
        
        // Show notification
        showNotification('Error: ' + (error.message || 'Failed to save product'), 'error');
    } finally {
        // Reset loading state
        const saveBtn = document.querySelector('.save-btn');
        saveBtn.textContent = 'Save Product';
        saveBtn.disabled = false;
    }
});

// Add notification function
function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '4px';
    notification.style.color = 'white';
    notification.style.fontWeight = '600';
    notification.style.zIndex = '10000';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    notification.style.transform = 'translateX(100%)';
    notification.style.transition = 'transform 0.3s ease';
    
    // Set background color based on type
    if (type === 'success') {
        notification.style.backgroundColor = '#4caf50';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#f44336';
    } else {
        notification.style.backgroundColor = '#2196f3';
    }
    
    // Add to document
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Functions
function showLoginScreen() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('admin-panel').style.display = 'none';
}

function showAdminPanel() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    loadCategories(); // Load categories first
    updateCategoryTitle();
    loadProducts();
    setupManagementButtons();
}

// Category dropdown in sidebar - for quick product addition
document.getElementById('category-dropdown').addEventListener('change', (e) => {
    // This is just for selecting category when adding new product
    // The actual filtering is done by tabs
});

// Load products function
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE}/products`);
        allProducts = await response.json();
        
        // Display products for current category
        displayProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Error loading products', 'error');
    }
}

function displayProducts() {
    const container = document.getElementById('products-list');
    
    if (!container) return;
    
    // Get products for current category
    let products = [];
    if (currentCategory === 'all') {
        // Show all products from all categories
        Object.values(allProducts.categories || {}).forEach(categoryProducts => {
            products.push(...categoryProducts);
        });
    } else {
        products = allProducts.categories[currentCategory] || [];
    }
    
    if (products.length === 0) {
        container.innerHTML = '<p class="no-products">No products found in this category.</p>';
        return;
    }
    
    container.innerHTML = products.map(product => {
        const media = product.media && product.media.length > 0 ? product.media[0] : null;
        const isVideo = media && (media.includes('.mp4') || media.includes('.mov') || media.includes('.avi') || media.includes('.webm'));
        
        let mediaHtml = '';
        if (media) {
            if (isVideo) {
                mediaHtml = `<video src="${media}" autoplay muted loop playsinline></video>`;
            } else {
                mediaHtml = `<img src="${media}" alt="${product.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0QwQ0JDMiIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkxhdG8iIGZvbnQtc2l6ZT0iMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM0NjRDM0MiPkltYWdlPC90ZXh0Pjwvc3ZnPg=='">`;
            }
        } else {
            mediaHtml = `<div class="no-image-placeholder">No Image</div>`;
        }
        
        return `
            <div class="admin-product-card" data-id="${product.id}">
                <div class="admin-product-image">
                    ${mediaHtml}
                </div>
                <div class="admin-product-info">
                    <div class="admin-product-category">${(product.category || 'Uncategorized').toUpperCase()}</div>
                    <h3 class="admin-product-name">${product.name}</h3>
                    <p class="admin-product-sku">SKU: ${product.sku || 'N/A'}</p>
                    ${product.price ? `<p class="admin-product-price">₹${parseFloat(product.price).toLocaleString()}</p>` : ''}
                    <div class="admin-product-actions">
                        <button class="edit-btn" onclick="editProduct('${product.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="delete-btn" onclick="deleteProduct('${product.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}
function editProduct(productId) {
    // Find the product by ID across all categories
    let productToEdit = null;
    let productCategory = null;

    for (const category in allProducts.categories) {
        const product = allProducts.categories[category].find(p => p.id === productId);
        if (product) {
            productToEdit = product;
            productCategory = category;
            break;
        }
    }

    if (!productToEdit) {
        showNotification('Product not found', 'error');
        return;
    }

    // Set editing mode BEFORE opening modal
    editingProductId = productId;
    currentCategory = productCategory;

    // Update category dropdown to match product's category
    document.getElementById('category-dropdown').value = productCategory;

    // Populate form with product data BEFORE opening modal
    document.getElementById('product-id').value = productToEdit.id;
    document.getElementById('product-name').value = productToEdit.name || '';
    document.getElementById('product-sku').value = productToEdit.sku || '';
    document.getElementById('product-description').value = productToEdit.description || '';
    document.getElementById('product-price').value = productToEdit.price || '';

    // Populate links
    document.getElementById('product-amazon-link').value = productToEdit.amazonLink || '';
    document.getElementById('product-flipkart-link').value = productToEdit.flipkartLink || '';
    document.getElementById('product-meesho-link').value = productToEdit.meeshoLink || '';

    // Handle media preview
    const previewContainer = document.getElementById('upload-preview');
    

    if (productToEdit.media && productToEdit.media.length > 0) {
        uploadedFiles = productToEdit.media.map(url => {
            return {
                name: url.split('/').pop(),
                url: url,
                isExisting: true
            };
        });

        // Show existing media previews
        productToEdit.media.forEach((url, index) => {
            const fileWrapper = document.createElement('div');
            fileWrapper.className = 'file-preview-item';
            fileWrapper.dataset.existingUrl = url;

            if (url.includes('.mp4') || url.includes('.mov') || url.includes('.avi') || url.includes('.webm')) {
                fileWrapper.innerHTML = `
                    <div class="file-preview-video">
                        <div class="video-icon">🎬</div>
                        <div class="file-preview-overlay">
                            <span class="file-name">${url.split('/').pop()}</span>
                            <span class="file-type">Video</span>
                        </div>
                    </div>
                `;
            } else {
                fileWrapper.innerHTML = `
                    <div class="file-preview-image">
                        <img src="${url}" alt="Product image">
                        <div class="file-preview-overlay">
                            <span class="file-name">${url.split('/').pop()}</span>
                        </div>
                    </div>
                `;
            }

            previewContainer.appendChild(fileWrapper);
        });
    } else {
        uploadedFiles = [];
    }

    // Now open the modal using the proper function
    openProductModal();
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/products/${currentCategory}/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            loadProducts();
        } else {
            alert('Failed to delete product');
        }
    } catch (error) {
        alert('Network error. Please try again.');
    }
}

function openProductModal() {
    const modal = document.getElementById('product-modal');
    const form = document.getElementById('product-form');
    const title = document.getElementById('modal-title');

    // Only reset if we're NOT editing
    if (!editingProductId) {
        form.reset();
        document.getElementById('product-id').value = '';
        document.getElementById('upload-preview').innerHTML = '';
        uploadedFiles = [];

        // Generate unique SKU for new product
        const sku = 'NYL-' + Date.now().toString().slice(-6);
        document.getElementById('product-sku').value = sku;

        title.textContent = 'Add Product';
    } else {
        title.textContent = 'Edit Product';
    }

    // Show modal
    modal.style.display = 'flex';
}

function closeProductModal() {
    document.getElementById('product-modal').style.display = 'none';
    document.getElementById('form-error').classList.remove('show');
    editingProductId = null;
    uploadedFiles = [];
    imageFilesToCrop = [];
    currentCropIndex = 0;
    croppedImages = [];
    document.getElementById('upload-preview').innerHTML = '';
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    // Make sure cropper modal is also closed
    document.getElementById('cropper-modal').style.display = 'none';
}

// Improved file selection handler
async function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    
    // Filter image files for cropping
    imageFilesToCrop = files.filter(file => file.type.startsWith('image/'));
    uploadedFiles = [...uploadedFiles, ...files];
    
    const previewContainer = document.getElementById('upload-preview');
    
    
    // Show preview for all files
    files.forEach((file, index) => {
        const fileWrapper = document.createElement('div');
        fileWrapper.className = 'file-preview-item';
        fileWrapper.dataset.fileIndex = index;
        
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                fileWrapper.innerHTML = `
                    <div class="file-preview-image">
                        <img src="${e.target.result}" alt="${file.name}">
                        <div class="file-preview-overlay">
                            <span class="file-name">${file.name}</span>
                            <span class="crop-status">Ready to crop</span>
                        </div>
                    </div>
                `;
            };
            reader.readAsDataURL(file);
        } else if (file.type.startsWith('video/')) {
            fileWrapper.innerHTML = `
                <div class="file-preview-video">
                    <div class="video-icon">🎬</div>
                    <div class="file-preview-overlay">
                        <span class="file-name">${file.name}</span>
                        <span class="file-type">Video</span>
                    </div>
                </div>
            `;
        } else {
            fileWrapper.innerHTML = `
                <div class="file-preview-other">
                    <div class="file-icon">📄</div>
                    <div class="file-preview-overlay">
                        <span class="file-name">${file.name}</span>
                        <span class="file-type">File</span>
                    </div>
                </div>
            `;
        }
        
        previewContainer.appendChild(fileWrapper);
    });
    
    // If we have images to crop, show the crop button
    if (imageFilesToCrop.length > 0) {
        // Remove existing crop button if any
        const existingCropBtn = document.querySelector('.crop-images-btn');
        if (existingCropBtn) {
            existingCropBtn.remove();
        }
        
        const cropButton = document.createElement('button');
        cropButton.type = 'button';
        cropButton.className = 'crop-images-btn';
        cropButton.textContent = `Crop ${imageFilesToCrop.length} Image(s)`;
        cropButton.addEventListener('click', openCropper);
        
        // Insert crop button after the select files button
        const selectBtn = document.getElementById('select-files-btn');
        selectBtn.parentNode.insertBefore(cropButton, selectBtn.nextSibling);
    }
}

// Improved cropper functions
function openCropper() {
    if (imageFilesToCrop.length === 0) return;
    
    currentCropIndex = 0;
    croppedImages = new Array(imageFilesToCrop.length).fill(null); // Initialize with null values
    
    document.getElementById('cropper-modal').style.display = 'flex';
    showCurrentImageInCropper();
    updateCropperIndicators();
}

function showCurrentImageInCropper() {
    if (currentCropIndex >= imageFilesToCrop.length) return;
    
    currentCropFile = imageFilesToCrop[currentCropIndex];
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const image = document.getElementById('cropper-image');
        image.src = e.target.result;
        
        // Destroy previous cropper instance if exists
        if (cropper) {
            cropper.destroy();
        }
        
        // Initialize new cropper
        cropper = new Cropper(image, {
            aspectRatio: NaN, // Free aspect ratio
            viewMode: 1,
            autoCropArea: 0.8,
            responsive: true,
            background: false
        });
        
        // Update title
        document.getElementById('cropper-title').textContent = 
            `Crop Image ${currentCropIndex + 1} of ${imageFilesToCrop.length}`;
    };
    
    reader.readAsDataURL(currentCropFile);
}

function updateCropperIndicators() {
    const indicatorsContainer = document.getElementById('cropper-indicators');
    indicatorsContainer.innerHTML = '';
    
    imageFilesToCrop.forEach((file, index) => {
        const indicator = document.createElement('div');
        indicator.className = 'cropper-indicator-item';
        if (index === currentCropIndex) {
            indicator.classList.add('active');
        }
        if (index < croppedImages.length) {
            indicator.classList.add('cropped');
        }
        indicator.addEventListener('click', () => {
            currentCropIndex = index;
            showCurrentImageInCropper();
            updateCropperIndicators();
        });
        indicatorsContainer.appendChild(indicator);
    });
}

function applyCrop() {
    if (!cropper) return;
    
    // Get cropped canvas
    const canvas = cropper.getCroppedCanvas({
        maxWidth: 1920,
        maxHeight: 1080,
        fillColor: '#fff',
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
    });
    
    // Convert to blob
    canvas.toBlob((blob) => {
        if (blob) {
            // Store cropped image
            croppedImages[currentCropIndex] = new File([blob], 
                `cropped_${imageFilesToCrop[currentCropIndex].name}`, 
                { type: 'image/jpeg' }
            );
            
            // Update indicator
            updateCropperIndicators();
            
            // Move to next image or finish
            if (currentCropIndex < imageFilesToCrop.length - 1) {
                currentCropIndex++;
                showCurrentImageInCropper();
                updateCropperIndicators();
            } else {
                // Show done button
                document.getElementById('apply-crop').style.display = 'none';
                document.getElementById('done-crop').style.display = 'block';
            }
        }
    }, 'image/jpeg', 0.9);
}

function skipCurrentCrop() {
    // Move to next image without cropping
    if (currentCropIndex < imageFilesToCrop.length - 1) {
        currentCropIndex++;
        showCurrentImageInCropper();
        updateCropperIndicators();
    } else {
        // Finish if this was the last image
        finishCroppingAndUpload();
    }
}

function finishCroppingAndUpload() {
    // Replace original images with cropped ones
    // Create a mapping of original files to their cropped versions
    const fileMapping = new Map();
    imageFilesToCrop.forEach((originalFile, index) => {
        if (croppedImages[index]) {
            fileMapping.set(originalFile, croppedImages[index]);
        }
    });
    
    // Update uploadedFiles array with cropped images
    uploadedFiles = uploadedFiles.map(file => {
        return fileMapping.has(file) ? fileMapping.get(file) : file;
    });
    
    closeCropper();
    
    // Show success message
    const previewContainer = document.getElementById('upload-preview');
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.textContent = 'Images cropped successfully! Click "Save Product" to upload.';
    previewContainer.appendChild(successMessage);
    
    // Remove crop button
    const cropButton = document.querySelector('.crop-images-btn');
    if (cropButton) {
        cropButton.remove();
    }
}

function closeCropper() {
    document.getElementById('cropper-modal').style.display = 'none';
    document.getElementById('apply-crop').style.display = 'block';
    document.getElementById('done-crop').style.display = 'none';
    
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
}

function addMediaPreview(url, isExisting = false, file = null) {
    const preview = document.getElementById('upload-preview');
    const item = document.createElement('div');
    item.className = 'upload-preview-item';
    
    const isVideo = url.includes('.mp4') || url.includes('.mov') || url.includes('.avi') || url.includes('.webm') || 
                    (file && file.type.startsWith('video/'));
    
    if (isVideo) {
        item.innerHTML = `
            <video src="${url}" controls></video>
            <span class="file-type-badge">VIDEO</span>
            <button type="button" class="remove-file" onclick="removeMediaPreview(this, ${isExisting})">×</button>
        `;
    } else {
        item.innerHTML = `
            <img src="${url}" alt="Preview">
            <span class="file-type-badge">IMAGE</span>
            <button type="button" class="remove-file" onclick="removeMediaPreview(this, ${isExisting})">×</button>
        `;
    }
    
    if (!isExisting && file) {
        item.dataset.fileIndex = uploadedFiles.length - 1;
    } else if (isExisting) {
        item.dataset.existingUrl = url;
    }
    
    preview.appendChild(item);
}

// Make function available globally
window.removeMediaPreview = function(button, isExisting) {
    const item = button.closest('.upload-preview-item');
    if (isExisting) {
        // For existing media, we'll handle it in the form submission
        item.remove();
    } else {
        const fileIndex = parseInt(item.dataset.fileIndex);
        if (!isNaN(fileIndex)) {
            uploadedFiles.splice(fileIndex, 1);
        }
        item.remove();
        // Re-index remaining items
        const items = document.querySelectorAll('.upload-preview-item:not([data-existing-url])');
        items.forEach((it, idx) => {
            it.dataset.fileIndex = idx;
        });
    }
};

// Close modal when clicking outside
document.getElementById('product-modal').addEventListener('click', (e) => {
    if (e.target.id === 'product-modal') {
        closeProductModal();
    }
});


// ===== Category Management =====

function setupManagementButtons() {
    // Category Management Button
    document.getElementById('manage-categories-btn').addEventListener('click', () => {
        openCategoryModal();
    });

    // SKU Management Button
    document.getElementById('manage-skus-btn').addEventListener('click', () => {
        openSKUModal();
    });

    // Close modals
    document.getElementById('close-category-modal').addEventListener('click', closeCategoryModal);
    document.getElementById('close-sku-modal').addEventListener('click', closeSKUModal);

    // Add Category Form
    document.getElementById('add-category-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await addCategory(e);
    });

    // Add SKU Form
    document.getElementById('add-sku-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await addSKU(e);
    });
}

// Load Categories for Admin (tabs + dropdown)
async function loadCategoriesForAdmin() {
    try {
        const response = await fetch(`${API_BASE}/categories`);
        const categories = await response.json();
        
        // Populate category tabs
        const filterContainer = document.querySelector('.admin-category-filter');
        const existingButtons = filterContainer.querySelectorAll('.filter-btn:not([data-category="all"])');
        existingButtons.forEach(btn => btn.remove());
        
        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.dataset.category = cat.name;
            btn.innerHTML = `<i class="fas ${cat.icon}"></i> ${cat.displayName}`;
            btn.addEventListener('click', () => {
                // Update active state
                document.querySelectorAll('.admin-category-filter .filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update current category
                currentCategory = cat.name;
                displayProducts();
            });
            filterContainer.appendChild(btn);
        });
        
        // Setup "All Products" button
        const allBtn = document.querySelector('.admin-category-filter .filter-btn[data-category="all"]');
        if (allBtn) {
            allBtn.addEventListener('click', () => {
                document.querySelectorAll('.admin-category-filter .filter-btn').forEach(b => b.classList.remove('active'));
                allBtn.classList.add('active');
                currentCategory = 'all';
                displayProducts();
            });
        }

        // Populate category dropdown in sidebar
        const dropdown = document.getElementById('category-dropdown');
        dropdown.innerHTML = '';
        
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.name;
            option.textContent = cat.displayName;
            dropdown.appendChild(option);
        });

        // Set current category to 'all' initially
        currentCategory = 'all';
    } catch (error) {
        console.error('Error loading categories:', error);
        showNotification('Error loading categories', 'error');
    }
}

function openCategoryModal() {
    document.getElementById('category-modal').style.display = 'flex';
    loadCategoriesList();
}

function closeCategoryModal() {
    document.getElementById('category-modal').style.display = 'none';
    document.getElementById('category-form-error').textContent = '';
    document.getElementById('add-category-form').reset();
}

async function loadCategoriesList() {
    try {
        const response = await fetch(`${API_BASE}/categories`);
        const categories = await response.json();
        
        const container = document.getElementById('categories-list');
        
        if (categories.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999;">No categories yet.</p>';
            return;
        }
        
        container.innerHTML = categories.map(cat => `
            <div class="category-item">
                <div class="category-info">
                    <div class="category-icon">
                        <i class="fas ${cat.icon}"></i>
                    </div>
                    <div class="category-details">
                        <h4>${cat.displayName}</h4>
                        <p>ID: ${cat.name}</p>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading categories list:', error);
    }
}

async function addCategory(e) {
    const errorDiv = document.getElementById('category-form-error');
    errorDiv.textContent = '';
    
    const formData = new FormData(e.target);
    const categoryData = {
        name: formData.get('name').toLowerCase().trim(),
        displayName: formData.get('displayName').trim(),
        icon: formData.get('icon').trim() || 'fa-box'
    };
    
    try {
        const response = await fetch(`${API_BASE}/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(categoryData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Category added successfully!', 'success');
            e.target.reset();
            loadCategoriesList();
            loadCategories(); // Refresh dropdown
        } else {
            errorDiv.textContent = data.error || 'Failed to add category';
        }
    } catch (error) {
        errorDiv.textContent = 'Network error. Please try again.';
    }
}

// ===== SKU Management =====

function openSKUModal() {
    document.getElementById('sku-modal').style.display = 'flex';
    loadSKUsList();
}

function closeSKUModal() {
    document.getElementById('sku-modal').style.display = 'none';
    document.getElementById('sku-form-error').textContent = '';
    document.getElementById('add-sku-form').reset();
}

async function loadSKUsList() {
    try {
        const response = await fetch(`${API_BASE}/skus`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const skus = await response.json();
        
        const container = document.getElementById('skus-list');
        
        if (skus.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999;">No SKUs yet.</p>';
            return;
        }
        
        container.innerHTML = skus.map(sku => `
            <div class="sku-item ${sku.isAssigned ? 'assigned' : ''}">
                <div class="sku-info">
                    <h4>${sku.skuId}</h4>
                    ${sku.description ? `<p>${sku.description}</p>` : ''}
                    ${sku.isAssigned && sku.assignedToProduct ? `<p style="font-size: 0.75rem; color: #f57c00;">Assigned to: ${sku.assignedToProduct}</p>` : ''}
                </div>
                <span class="sku-status ${sku.isAssigned ? 'assigned' : 'available'}">
                    ${sku.isAssigned ? 'Assigned' : 'Available'}
                </span>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading SKUs list:', error);
    }
}

async function addSKU(e) {
    const errorDiv = document.getElementById('sku-form-error');
    errorDiv.textContent = '';
    
    const formData = new FormData(e.target);
    const skuData = {
        skuId: formData.get('skuId').trim().toUpperCase(),
        description: formData.get('description').trim()
    };
    
    try {
        const response = await fetch(`${API_BASE}/skus`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(skuData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('SKU added successfully!', 'success');
            e.target.reset();
            loadSKUsList();
        } else {
            errorDiv.textContent = data.error || 'Failed to add SKU';
        }
    } catch (error) {
        errorDiv.textContent = 'Network error. Please try again.';
    }
}

