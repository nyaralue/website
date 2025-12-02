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
            </div>
        `;

        this.track = this.container.querySelector('.stagger-carousel-track');
        this.prevBtn = this.container.querySelector('.stagger-nav-prev');
        this.nextBtn = this.container.querySelector('.stagger-nav-next');
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
        const rotation = isCenter ? 0 : position % 2 ? 2.5 : -2.5;

        card.style.cssText = `
            width: ${this.cardSize}px;
            height: ${this.cardSize}px;
            transform: translate(-50%, -50%) translateX(${translateX}px) translateY(${translateY}px) rotate(${rotation}deg);
            z-index: ${isCenter ? 10 : 0};
        `;

        const mediaUrl = product.media && product.media.length > 0 ? product.media[0] : null;
        const isVideo = mediaUrl && (mediaUrl.includes('.mp4') || mediaUrl.includes('.mov') || mediaUrl.includes('.avi') || mediaUrl.includes('.webm'));

        card.innerHTML = `
            <span class="stagger-card-accent" style="right: -2px; top: 48px; width: ${SQRT_5000}px;"></span>

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
