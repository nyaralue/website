// Razorpay Live Integration for Nyara Luxe (20% OFF + Prefilled Customer Details + Amplitude Funnel Tracking)
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

function payWithRazorpay(productName, mrpPrice, productId, customerDetails = {}, category = 'Uncategorized') {
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
        modal: {
            ondismiss: function () {
                // Track user closing the payment modal without paying
                if (window.trackAmplitudeEvent) {
                    window.trackAmplitudeEvent('Payment Cancelled', {
                        product_name: productName,
                        product_id: productId || 'unknown',
                        product_sku: productId || 'unknown',
                        category: category || 'Uncategorized',
                        amount: discountedPrice,
                        currency: 'INR',
                        payment_method: 'Razorpay',
                        reason: 'User closed payment window before completing payment',
                        customer_name: customerDetails.name || '',
                        customer_phone: customerDetails.phone || ''
                    });
                }
            }
        },
        handler: function (response) {
            const paymentId = response.razorpay_payment_id;
            
            // Save order & customer details to backend (Sends exactly 1 single clean row to Google Sheet)
            const orderPayload = {
                productName: productName,
                productSku: productId || 'unknown',
                name: customerDetails.name || 'Customer',
                phone: customerDetails.phone || '',
                address: customerDetails.address || '',
                pincode: customerDetails.pincode || '',
                email: customerDetails.email || '',
                locationLink: customerDetails.locationLink || '',
                query: `ORDER SUCCESSFUL! Payment ID: ${paymentId} (Amount Paid: ₹${discountedPrice})`,
                timestamp: new Date().toISOString()
            };

            fetch('/api/checkout-submit', {
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

            // Amplitude Purchase Event Tracking (Step 8 in Funnel: Payment Success)
            if (window.trackAmplitudeEvent) {
                window.trackAmplitudeEvent('Order Placed', {
                    transaction_id: paymentId,
                    payment_id: paymentId,
                    amount: discountedPrice,
                    currency: 'INR',
                    product_name: productName,
                    product_sku: productId || 'unknown',
                    product_id: productId || 'unknown',
                    category: category || 'Uncategorized',
                    payment_method: 'Razorpay',
                    payment_status: 'success',
                    customer_name: customerDetails.name || '',
                    customer_phone: customerDetails.phone || '',
                    customer_email: customerDetails.email || '',
                    customer_pincode: customerDetails.pincode || ''
                });

                window.trackAmplitudeEvent('Payment Completed', {
                    transaction_id: paymentId,
                    payment_id: paymentId,
                    amount: discountedPrice,
                    currency: 'INR',
                    product_name: productName,
                    product_sku: productId || 'unknown',
                    product_id: productId || 'unknown',
                    category: category || 'Uncategorized',
                    payment_method: 'Razorpay',
                    payment_status: 'success',
                    customer_name: customerDetails.name || '',
                    customer_phone: customerDetails.phone || ''
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

    // Track payment failure
    rzp.on('payment.failed', function (response) {
        if (window.trackAmplitudeEvent) {
            window.trackAmplitudeEvent('Payment Failed', {
                product_name: productName,
                product_sku: productId || 'unknown',
                product_id: productId || 'unknown',
                category: category || 'Uncategorized',
                amount: discountedPrice,
                currency: 'INR',
                payment_method: 'Razorpay',
                error_code: response.error?.code || 'unknown',
                error_description: response.error?.description || 'Payment failed',
                error_source: response.error?.source || '',
                error_step: response.error?.step || '',
                error_reason: response.error?.reason || '',
                customer_name: customerDetails.name || '',
                customer_phone: customerDetails.phone || ''
            });
        }
        alert(`Payment Cancelled or Failed: ${response.error?.description || ''}`);
    });

    // Track Step 7 in Funnel: Payment Page Opened (Razorpay Gateway Loaded)
    if (window.trackAmplitudeEvent) {
        window.trackAmplitudeEvent('Payment Page Opened', {
            product_name: productName,
            product_id: productId || 'unknown',
            product_sku: productId || 'unknown',
            category: category || 'Uncategorized',
            amount: discountedPrice,
            currency: 'INR',
            payment_method: 'Razorpay',
            customer_name: customerDetails.name || '',
            customer_phone: customerDetails.phone || '',
            customer_email: customerDetails.email || '',
            customer_pincode: customerDetails.pincode || ''
        });
    }

    rzp.open();
}

window.payWithRazorpay = payWithRazorpay;
