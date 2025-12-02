class StaggerCarousel {
    constructor(containerSelector, options = {}) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) {
            console.error('Carousel container not found');
            return;
        }

        this.cardSize = window.innerWidth >= 1024 ? 420 : window.innerWidth >= 640 ? 360 : 300;
        this.products = [];
        this.currentIndex = 0;
        this.isAnimating = false;

        this.options = {
            autoRotate: options.autoRotate || false,
            autoRotateInterval: options.autoRotateInterval || 5000,
            onCardClick: options.onCardClick || null,
            ...options
        };

        this.init();
    }

    init() {
        this.createCarouselStructure();
        this.setupEventListeners();

        if (this.options.autoRotate) {
            this.startAutoRotate();
        }
    }

    createCarouselStructure() {
        this.container.innerHTML = `
            <div class="stagger-carousel-wrapper">
                <div class="stagger-carousel-track"></div>
                <div class="stagger-carousel-controls">
                    <button class="stagger-nav-btn stagger-nav-prev" aria-label="Previous product">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <button class="stagger-nav-btn stagger-nav-next" aria-label="Next product">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                </div>
                <div style="text-align: center; margin-top: 2rem;">
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 0.5rem; font-style: italic;">
                        <i class="fas fa-hand-pointer"></i> Drag or swipe to browse
                    </p>
                </div>
                <div class="view-all-products-container" style="text-align: center; margin-top: 1rem;">
                    <a href="/products-grid.html" class="view-all-products-btn" style="display: inline-block; padding: 1rem 2.5rem; background: var(--deep-olive); color: var(--warm-off-white); text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 1rem; text-transform: uppercase; letter-spacing: 1px; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(70, 76, 60, 0.2);">
                        <i class="fas fa-th" style="margin-right: 0.5rem;"></i> View All Products
                    </a>
                </div>
            </div>
        `;

        this.track = this.container.querySelector('.stagger-carousel-track');
        this.prevBtn = this.container.querySelector('.stagger-nav-prev');
        this.nextBtn = this.container.querySelector('.stagger-nav-next');
        
        // Add hover effect to view all button
        const viewAllBtn = this.container.querySelector('.view-all-products-btn');
        if (viewAllBtn) {
            viewAllBtn.addEventListener('mouseenter', () => {
                viewAllBtn.style.background = 'var(--muted-moss)';
                viewAllBtn.style.transform = 'translateY(-3px)';
                viewAllBtn.style.boxShadow = '0 6px 20px rgba(70, 76, 60, 0.3)';
            });
            viewAllBtn.addEventListener('mouseleave', () => {
                viewAllBtn.style.background = 'var(--deep-olive)';
                viewAllBtn.style.transform = 'translateY(0)';
                viewAllBtn.style.boxShadow = '0 4px 15px rgba(70, 76, 60, 0.2)';
            });
        }
    }

    setupEventListeners() {
        this.prevBtn.addEventListener('click', () => this.move(-1));
        this.nextBtn.addEventListener('click', () => this.move(1));

        window.addEventListener('resize', () => {
            const newSize = window.innerWidth >= 1024 ? 420 : window.innerWidth >= 640 ? 360 : 300;
            if (newSize !== this.cardSize) {
                this.cardSize = newSize;
                this.render();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.move(-1);
            if (e.key === 'ArrowRight') this.move(1);
        });

        // Add drag and swipe functionality
        this.setupDragAndSwipe();
    }

    setupDragAndSwipe() {
        let startX = 0;
        let startY = 0;
        let isDragging = false;
        let startTime = 0;

        // Touch events for mobile
        this.track.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startTime = Date.now();
            isDragging = true;
        }, { passive: true });

        this.track.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const diffX = Math.abs(currentX - startX);
            const diffY = Math.abs(currentY - startY);
            
            // Prevent vertical scrolling if horizontal swipe is detected
            if (diffX > diffY && diffX > 10) {
                e.preventDefault();
            }
        });

        this.track.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            
            const endX = e.changedTouches[0].clientX;
            const endTime = Date.now();
            const diffX = startX - endX;
            const diffTime = endTime - startTime;
            const velocity = Math.abs(diffX) / diffTime;
            
            // Swipe threshold: 50px or fast swipe
            if (Math.abs(diffX) > 50 || velocity > 0.5) {
                if (diffX > 0) {
                    this.move(1); // Swipe left - next
                } else {
                    this.move(-1); // Swipe right - previous
                }
            }
            
            isDragging = false;
        });

        // Mouse events for desktop
        let isMouseDown = false;
        
        this.track.addEventListener('mousedown', (e) => {
            startX = e.clientX;
            startTime = Date.now();
            isMouseDown = true;
            isDragging = false;
            this.track.style.cursor = 'grabbing';
        });

        this.track.addEventListener('mousemove', (e) => {
            if (!isMouseDown) return;
            
            const currentX = e.clientX;
            const diffX = Math.abs(currentX - startX);
            
            // Consider it dragging if moved more than 5px
            if (diffX > 5) {
                isDragging = true;
            }
        });

        this.track.addEventListener('mouseup', (e) => {
            if (!isMouseDown) return;
            
            const endX = e.clientX;
            const endTime = Date.now();
            const diffX = startX - endX;
            const diffTime = endTime - startTime;
            const velocity = Math.abs(diffX) / diffTime;
            
            // Drag threshold: 80px or fast drag
            if (isDragging && (Math.abs(diffX) > 80 || velocity > 0.3)) {
                if (diffX > 0) {
                    this.move(1); // Drag left - next
                } else {
                    this.move(-1); // Drag right - previous
                }
            }
            
            isMouseDown = false;
            isDragging = false;
            this.track.style.cursor = 'grab';
        });

        this.track.addEventListener('mouseleave', () => {
            if (isMouseDown) {
                isMouseDown = false;
                isDragging = false;
                this.track.style.cursor = 'grab';
            }
        });

        // Set initial cursor
        this.track.style.cursor = 'grab';
        this.track.style.userSelect = 'none';
    }

    loadProducts(products) {
        this.products = products.map((product, index) => ({
            ...product,
            tempId: `${product.id}-${Date.now()}-${index}`
        }));
        this.render();
    }

    move(steps) {
        if (this.isAnimating || this.products.length === 0) return;

        this.isAnimating = true;

        const newProducts = [...this.products];

        if (steps > 0) {
            for (let i = 0; i < steps; i++) {
                const item = newProducts.shift();
                if (item) {
                    newProducts.push({ ...item, tempId: `${item.id}-${Date.now()}-${Math.random()}` });
                }
            }
        } else {
            for (let i = 0; i < Math.abs(steps); i++) {
                const item = newProducts.pop();
                if (item) {
                    newProducts.unshift({ ...item, tempId: `${item.id}-${Date.now()}-${Math.random()}` });
                }
            }
        }

        this.products = newProducts;
        this.render();

        setTimeout(() => {
            this.isAnimating = false;
        }, 500);
    }

    render() {
        if (!this.track || this.products.length === 0) {
            this.track.innerHTML = `
                <div class="stagger-empty-state">
                    <p>No products available</p>
                </div>
            `;
            return;
        }

        this.track.innerHTML = '';

        this.products.forEach((product, index) => {
            const position = this.products.length % 2
                ? index - (this.products.length + 1) / 2
                : index - this.products.length / 2;

            const card = this.createCard(product, position);
            this.track.appendChild(card);
        });
    }

    createCard(product, position) {
        const card = document.createElement('div');
        const isCenter = position === 0;

        card.className = `stagger-card ${isCenter ? 'stagger-card-center' : ''}`;
        card.dataset.position = position;

        // More horizontal spacing and smoother transitions
        const translateX = (this.cardSize * 0.85) * position;
        const translateY = isCenter ? -40 : Math.abs(position) * 8;
        const rotation = isCenter ? 0 : position * 1.5;
        const scale = isCenter ? 1.15 : Math.max(0.75, 1 - Math.abs(position) * 0.15);
        const opacity = Math.abs(position) > 2 ? 0 : 1 - Math.abs(position) * 0.2;

        card.style.cssText = `
            width: ${this.cardSize}px;
            height: auto;
            transform: translate(-50%, -50%) translateX(${translateX}px) translateY(${translateY}px) rotate(${rotation}deg) scale(${scale});
            z-index: ${isCenter ? 10 : 5 - Math.abs(position)};
            opacity: ${opacity};
        `;

        const mediaUrl = product.media && product.media.length > 0 ? product.media[0] : null;
        const isVideo = mediaUrl && (mediaUrl.includes('.mp4') || mediaUrl.includes('.mov') || mediaUrl.includes('.avi') || mediaUrl.includes('.webm'));

        card.innerHTML = `
            <span class="stagger-card-accent" style="right: -2px; top: 48px; width: ${Math.sqrt(5000)}px;"></span>

            <div class="stagger-card-media">
                ${mediaUrl ? (
                    isVideo
                        ? `<video autoplay muted loop playsinline><source src="${mediaUrl}" type="video/mp4"></video>`
                        : `<img src="${mediaUrl}" alt="${product.name}">`
                ) : `<div class="stagger-card-placeholder">No Image</div>`}
            </div>

            <div class="stagger-card-content">
                <h3 class="stagger-card-title">"${product.name}"</h3>
                ${product.price ? `<p class="stagger-card-price">₹${product.price}</p>` : ''}
                ${product.sku ? `<p class="stagger-card-sku">SKU: ${product.sku}</p>` : ''}
            </div>

            <div class="stagger-card-footer">
                <button class="stagger-card-buy-btn" data-product-id="${product.id}">
                    Buy Now
                </button>
            </div>
        `;

        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('stagger-card-buy-btn')) {
                e.stopPropagation();
                if (this.options.onCardClick) {
                    this.options.onCardClick(product, 'buy');
                }
                return;
            }

            if (position !== 0) {
                this.move(position);
            }
        });

        return card;
    }

    startAutoRotate() {
        this.autoRotateTimer = setInterval(() => {
            this.move(1);
        }, this.options.autoRotateInterval);
    }

    stopAutoRotate() {
        if (this.autoRotateTimer) {
            clearInterval(this.autoRotateTimer);
        }
    }

    destroy() {
        this.stopAutoRotate();
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

window.StaggerCarousel = StaggerCarousel;
