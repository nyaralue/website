// Razorpay Live Integration for Nyara Luxe (20% OFF + Prefilled Customer Details)
const RAZORPAY_KEY_ID = 'rzp_live_TLFLvqgzwxhIg3';

// Dynamically load Razorpay SDK if not present
(function loadRazorpaySDK() {
    if (!document.getElementById('razorpay-sdk')) {
        const script = document.createElement('script');
        script.id = 'razorpay-sdk';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.head.appendChild(script);
    }
})();

function payWithRazorpay(productName, mrpPrice, productId, customerDetails = {}) {
    const mrp = parseFloat(mrpPrice) || 0;
    const discountedPrice = Math.round(mrp * 0.80); // 20% OFF from MRP
    const amountInPaise = discountedPrice > 0 ? discountedPrice * 100 : 0;

    if (!window.Razorpay) {
        alert('Payment gateway is loading. Please try again in a few seconds.');
        return;
    }

    if (amountInPaise <= 0) {
        alert('Invalid product price for payment.');
        return;
    }

    const options = {
        key: RAZORPAY_KEY_ID,
        amount: amountInPaise,
        currency: 'INR',
        name: 'Nyara Luxe',
        description: `Order: ${productName} (20% OFF + Free Delivery)`,
        image: 'Nyara_Home_Visiting_Card-removebg-preview.png',
        prefill: {
            name: customerDetails.name || '',
            contact: customerDetails.phone || '',
            email: customerDetails.email || ''
        },
        handler: function (response) {
            const paymentId = response.razorpay_payment_id;
            
            // Save order & customer details to backend
            const orderPayload = {
                productName: productName,
                productSku: productId || 'unknown',
                name: customerDetails.name || 'Customer',
                email: customerDetails.email || '',
                query: `ORDER SUCCESSFUL! Payment ID: ${paymentId}. Address: ${customerDetails.address || ''}, Location: ${customerDetails.locationLink || 'N/A'}, Amount Paid: ₹${discountedPrice}`,
                timestamp: new Date().toISOString()
            };

            fetch('/api/help-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderPayload)
            }).catch(err => console.error('Order save error:', err));

            alert(`🎉 Payment Successful!\nPayment ID: ${paymentId}\n\nThank you ${customerDetails.name || ''}! Your order for "${productName}" has been placed with FREE delivery.`);
            
            // GA4 Purchase Event Tracking
            if (window.trackGAEvent) {
                window.trackGAEvent('purchase', {
                    transaction_id: paymentId,
                    value: discountedPrice,
                    currency: 'INR',
                    items: [{
                        item_id: productId || 'unknown',
                        item_name: productName,
                        price: discountedPrice
                    }]
                });
            }

            // Close platform modal if open
            const modal = document.getElementById('ecommerce-modal');
            if (modal) modal.classList.remove('show');
        },
        theme: {
            color: '#2C3E2E'
        }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
        alert(`Payment Cancelled or Failed: ${response.error.description || ''}`);
    });
    rzp.open();
}

window.payWithRazorpay = payWithRazorpay;
