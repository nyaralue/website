// Nyara Luxe Customer Checkout Modal & Geolocation Integration

(function () {
    // Inject Checkout Modal HTML into Body on DOM Ready
    document.addEventListener('DOMContentLoaded', () => {
        if (!document.getElementById('checkout-form-modal')) {
            const modalHtml = `
            <div id="checkout-form-modal" class="checkout-modal-backdrop" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.75); z-index: 99999; align-items: center; justify-content: center; padding: 16px; box-sizing: border-box; overflow-y: auto;">
                <div class="checkout-modal-card" style="background: #FFF; width: 100%; max-width: 480px; border-radius: 16px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); position: relative; max-height: 90vh; overflow-y: auto; color: #333; font-family: 'Lato', sans-serif;">
                    <button id="close-checkout-modal" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #888; line-height: 1;">&times;</button>
                    
                    <div style="text-align: center; margin-bottom: 16px;">
                        <h3 style="font-family: 'Cormorant Garamond', serif; font-size: 1.6rem; color: #2C3E2E; margin: 0 0 4px 0;">Delivery & Payment Details</h3>
                        <p style="font-size: 0.85rem; color: #666; margin: 0;">Get <strong style="color: #27ae60;">20% OFF</strong> + <strong style="color: #D4AF37;">FREE Delivery</strong></p>
                    </div>

                    <!-- Order Summary Box -->
                    <div id="checkout-order-summary" style="background: #F8F9F8; border: 1px solid #E2E8E3; border-radius: 10px; padding: 12px 16px; margin-bottom: 18px; font-size: 0.9rem;">
                        <div style="font-weight: 700; color: #2C3E2E; margin-bottom: 6px;" id="summary-product-name">Product Name</div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <span>Original MRP:</span>
                            <span id="summary-mrp" style="text-decoration: line-through; color: #888;">₹0</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #27ae60;">
                            <span>Discount (20% OFF):</span>
                            <span id="summary-discount">-₹0</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #27ae60;">
                            <span>Delivery Charge:</span>
                            <strong>FREE</strong>
                        </div>
                        <hr style="border: none; border-top: 1px dashed #CCC; margin: 6px 0;">
                        <div style="display: flex; justify-content: space-between; font-size: 1.05rem; font-weight: 700; color: #2C3E2E;">
                            <span>Total Payable:</span>
                            <span id="summary-total" style="color: #D4AF37;">₹0</span>
                        </div>
                    </div>

                    <!-- Customer Details Form -->
                    <form id="checkout-customer-form" onsubmit="handleCheckoutSubmit(event)">
                        <div style="margin-bottom: 12px;">
                            <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 4px; color: #2C3E2E;">Full Name <span style="color:red;">*</span></label>
                            <input type="text" id="cust-name" required placeholder="Enter your name" style="width: 100%; padding: 10px 12px; border: 1px solid #CCC; border-radius: 8px; font-size: 0.95rem; box-sizing: border-box;">
                        </div>

                        <div style="margin-bottom: 12px;">
                            <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 4px; color: #2C3E2E;">Mobile Number <span style="color:red;">*</span></label>
                            <input type="tel" id="cust-phone" required pattern="[0-9]{10}" maxlength="10" placeholder="10-digit mobile number" style="width: 100%; padding: 10px 12px; border: 1px solid #CCC; border-radius: 8px; font-size: 0.95rem; box-sizing: border-box;">
                        </div>

                        <div style="margin-bottom: 12px;">
                            <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 4px; color: #2C3E2E;">Full Delivery Address <span style="color:red;">*</span></label>
                            <textarea id="cust-address" required rows="2" placeholder="House/Flat No., Building, Street Name, Area" style="width: 100%; padding: 10px 12px; border: 1px solid #CCC; border-radius: 8px; font-size: 0.95rem; box-sizing: border-box; resize: vertical;"></textarea>
                        </div>

                        <div style="margin-bottom: 12px;">
                            <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 4px; color: #2C3E2E;">Pincode <span style="color:red;">*</span></label>
                            <input type="text" id="cust-pincode" required pattern="[0-9]{6}" maxlength="6" placeholder="6-digit Pincode" style="width: 100%; padding: 10px 12px; border: 1px solid #CCC; border-radius: 8px; font-size: 0.95rem; box-sizing: border-box;">
                        </div>

                        <div style="margin-bottom: 12px;">
                            <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 4px; color: #2C3E2E;">Email Address <span style="font-size:0.75rem; color:#777;">(Optional)</span></label>
                            <input type="email" id="cust-email" placeholder="example@email.com" style="width: 100%; padding: 10px 12px; border: 1px solid #CCC; border-radius: 8px; font-size: 0.95rem; box-sizing: border-box;">
                        </div>

                        <div style="margin-bottom: 16px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <label style="font-size: 0.85rem; font-weight: 600; color: #2C3E2E;">Location Link <span style="font-size:0.75rem; color:#777;">(Optional)</span></label>
                                <button type="button" onclick="detectUserLocation()" style="background: #EAF2EB; border: 1px solid #2C3E2E; color: #2C3E2E; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                                    <i class="fas fa-location-arrow"></i> Use My Location
                                </button>
                            </div>
                            <input type="url" id="cust-location" placeholder="Google Maps link (or click Use My Location)" style="width: 100%; padding: 10px 12px; border: 1px solid #CCC; border-radius: 8px; font-size: 0.9rem; box-sizing: border-box;">
                        </div>

                        <button type="submit" id="pay-submit-btn" style="width: 100%; background: linear-gradient(135deg, #2C3E2E 0%, #3D523F 100%); color: #FFF; border: 1px solid #D4AF37; padding: 14px; border-radius: 10px; font-size: 1.05rem; font-weight: 700; cursor: pointer; box-shadow: 0 4px 14px rgba(44, 62, 46, 0.3);">
                            Proceed to Pay (Razorpay)
                        </button>
                    </form>
                </div>
            </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            // Modal Close button
            document.getElementById('close-checkout-modal').addEventListener('click', closeCheckoutModal);
            
            // Backdrop click close
            document.getElementById('checkout-form-modal').addEventListener('click', (e) => {
                if (e.target.id === 'checkout-form-modal') closeCheckoutModal();
            });
        }
    });
})();

let currentCheckoutProduct = null;

function openCheckoutModal(productName, price, productId) {
    const mrpPrice = Math.round((parseFloat(price) || 0) * 1.30); // 30% increased MRP
    const discountedPrice = Math.round(mrpPrice * 0.80); // 20% OFF
    const discountAmt = mrpPrice - discountedPrice;

    currentCheckoutProduct = {
        name: productName,
        mrp: mrpPrice,
        price: discountedPrice,
        productId: productId
    };

    document.getElementById('summary-product-name').textContent = productName;
    document.getElementById('summary-mrp').textContent = `₹${mrpPrice.toLocaleString()}`;
    document.getElementById('summary-discount').textContent = `-₹${discountAmt.toLocaleString()}`;
    document.getElementById('summary-total').textContent = `₹${discountedPrice.toLocaleString()}`;
    document.getElementById('pay-submit-btn').innerHTML = `Proceed to Pay ₹${discountedPrice.toLocaleString()} (Razorpay)`;

    const modal = document.getElementById('checkout-form-modal');
    modal.style.display = 'flex';
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkout-form-modal');
    if (modal) modal.style.display = 'none';
}

function detectUserLocation() {
    const locInput = document.getElementById('cust-location');
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
    }

    locInput.placeholder = 'Fetching location...';
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            locInput.value = `https://www.google.com/maps?q=${lat},${lng}`;
            locInput.placeholder = 'Google Maps link auto-filled!';
        },
        (error) => {
            alert('Unable to retrieve location. Please paste location link manually if needed.');
            locInput.placeholder = 'Google Maps link (Optional)';
        }
    );
}

function handleCheckoutSubmit(event) {
    event.preventDefault();

    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const address = document.getElementById('cust-address').value.trim();
    const pincode = document.getElementById('cust-pincode').value.trim();
    const email = document.getElementById('cust-email').value.trim();
    const location = document.getElementById('cust-location').value.trim();

    if (!name || !phone || !address || !pincode) {
        alert('Please fill in all required fields.');
        return;
    }

    const customerDetails = {
        name: name,
        phone: phone,
        address: `${address}, Pincode: ${pincode}`,
        pincode: pincode,
        email: email,
        locationLink: location
    };

    // 1. Send instant email notification to info@nyaraluxe.in via FormSubmit (Zero password/setup required)
    fetch('https://formsubmit.co/ajax/info@nyaraluxe.in', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            _subject: `🛒 New Nyara Luxe Order: ${currentCheckoutProduct ? currentCheckoutProduct.name : 'Product'}`,
            _template: 'table',
            "Product Name": currentCheckoutProduct ? currentCheckoutProduct.name : 'Nyara Luxe Product',
            "Offer Price": `₹${currentCheckoutProduct ? currentCheckoutProduct.price : 'N/A'} (20% OFF + Free Delivery)`,
            "Customer Name": name,
            "Mobile Phone": phone,
            "Delivery Address": address,
            "Pincode": pincode,
            "Email Address": email || "Not provided",
            "Google Maps Location": location || "Not provided",
            "Date & Time": new Date().toLocaleString()
        })
    }).catch(err => console.error('FormSubmit email error:', err));

    // 2. Immediately post order details to backend for MongoDB & Google Sheets
    fetch('/api/checkout-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            productName: currentCheckoutProduct ? currentCheckoutProduct.name : 'Nyara Luxe Product',
            productSku: currentCheckoutProduct ? currentCheckoutProduct.productId : 'N/A',
            name: name,
            phone: phone,
            address: address,
            pincode: pincode,
            email: email,
            locationLink: location,
            query: `NEW ORDER FORM SUBMITTED! Customer: ${name}, Phone: ${phone}, Address: ${address}, Pincode: ${pincode}, Location: ${location || 'N/A'}, Item: ${currentCheckoutProduct ? currentCheckoutProduct.name : ''}, Price: ₹${currentCheckoutProduct ? currentCheckoutProduct.price : ''}`,
            timestamp: new Date().toISOString()
        })
    }).catch(err => console.error('Checkout notification error:', err));

    // Close the customer form modal
    closeCheckoutModal();

    // Trigger Razorpay payment with 20% discount & customer details prefilled
    if (window.payWithRazorpay) {
        window.payWithRazorpay(
            currentCheckoutProduct ? currentCheckoutProduct.name : 'Product',
            currentCheckoutProduct ? currentCheckoutProduct.mrp : 0,
            currentCheckoutProduct ? currentCheckoutProduct.productId : '',
            customerDetails
        );
    } else {
        alert('Razorpay payment gateway loading... Please try again.');
    }
}

window.openCheckoutModal = openCheckoutModal;
window.closeCheckoutModal = closeCheckoutModal;
window.detectUserLocation = detectUserLocation;
window.handleCheckoutSubmit = handleCheckoutSubmit;
