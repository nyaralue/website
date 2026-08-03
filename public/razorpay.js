// Razorpay Live Integration for Nyara Luxe
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

function payWithRazorpay(productName, originalPrice, productId) {
    const priceNum = parseFloat(originalPrice) || 0;
    const discountedPrice = Math.round(priceNum * 0.85); // 15% OFF from MRP
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
        description: `Order: ${productName} (15% OFF)`,
        image: 'Nyara_Home_Visiting_Card-removebg-preview.png',
        handler: function (response) {
            const paymentId = response.razorpay_payment_id;
            alert(`🎉 Payment Successful!\nPayment ID: ${paymentId}\nThank you for ordering ${productName} from Nyara Luxe.`);
            
            // GA4 Purchase Tracking Event
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

            // Close modal if open
            const modal = document.getElementById('ecommerce-modal');
            if (modal) modal.classList.remove('show');
        },
        theme: {
            color: '#2C3E2E'
        }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
        alert(`Payment Failed: ${response.error.description || 'Transaction cancelled'}`);
    });
    rzp.open();
}

window.payWithRazorpay = payWithRazorpay;
