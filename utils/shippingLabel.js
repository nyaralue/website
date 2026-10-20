/**
 * Shipping Label & Marketplace Notification Engine for Nyara Luxe
 * Handles 4x6 / A6 courier shipping labels, marketplace emails with product photos,
 * and one-click 'Accept Order' / 'Accept & Generate Label' action triggers.
 */

function generateMarketplaceOrderEmail(order, baseUrl = 'https://website-ppur.vercel.app') {
  const orderId = order.orderId || 'NL-ORD-0000';
  const platform = String(order.platform || 'website').toUpperCase();
  const sku = order.productSku || order.sku || 'N/A';
  const productName = order.productName || 'Nyara Luxe Home Decor Fixture';
  const imageUrl = order.imageUrl || 'https://res.cloudinary.com/dgn1wdfdw/image/upload/v1775405892/nyara-luxe-uploads/mphweysnpgmavfe4rlvi.png';
  const qty = Number(order.quantity || order.qty) || 1;
  const amount = order.amount || 0;
  const customerName = order.customerName || order.name || 'Valued Customer';
  const phone = order.customerPhone || order.phone || 'N/A';
  const address = order.deliveryAddress || order.address || 'N/A';
  const pincode = order.pincode || 'N/A';
  const dateStr = order.orderDate || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const platColors = {
    'FLIPKART': { bg: '#2874F0', text: '#FFFFFF', badge: '🛒 FLIPKART ORDER' },
    'MEESHO': { bg: '#9C27B0', text: '#FFFFFF', badge: '🛍️ MEESHO ORDER' },
    'AMAZON': { bg: '#FF9900', text: '#000000', badge: '📦 AMAZON ORDER' },
    'WEBSITE': { bg: '#2C3E2E', text: '#D4AF37', badge: '🌐 WEBSITE ORDER' }
  };
  const cfg = platColors[platform] || platColors['WEBSITE'];

  const acceptUrl = `${baseUrl}/api/orders/action?orderId=${encodeURIComponent(orderId)}&action=accept`;
  const labelUrl = `${baseUrl}/api/orders/action?orderId=${encodeURIComponent(orderId)}&action=accept_label`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Order - ${orderId}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f4f6f8; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e1e4e8;">
    
    <!-- Top Platform Header -->
    <div style="background: ${cfg.bg}; color: ${cfg.text}; padding: 18px 24px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td>
            <span style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 20px; display: inline-block;">
              ${cfg.badge}
            </span>
            <h2 style="margin: 8px 0 0; font-size: 20px; font-weight: 800;">New Order Received!</h2>
          </td>
          <td style="text-align: right; vertical-align: top;">
            <span style="font-size: 12px; opacity: 0.9;">Order ID</span>
            <div style="font-size: 14px; font-weight: 900; letter-spacing: 0.5px;">${orderId}</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Product Visual Showcase (Photo + SKU) -->
    <div style="padding: 24px; border-bottom: 1px solid #edf0f2;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <!-- Product Photo -->
          <td style="width: 130px; vertical-align: top; padding-right: 18px;">
            <div style="width: 130px; height: 130px; border-radius: 10px; overflow: hidden; border: 1px solid #e1e4e8; background: #fafafa;">
              <img src="${imageUrl}" alt="${sku}" style="width: 130px; height: 130px; object-fit: cover; display: block;">
            </div>
          </td>
          <!-- Product Info -->
          <td style="vertical-align: top;">
            <div style="margin-bottom: 6px;">
              <span style="background: #eef5ee; color: #2C3E2E; border: 1.5px solid #2C3E2E; padding: 4px 10px; border-radius: 6px; font-weight: 900; font-size: 15px; display: inline-block;">
                SKU: ${sku}
              </span>
            </div>
            <h3 style="margin: 6px 0 8px; font-size: 15px; color: #1a1a1a; line-height: 1.4; font-weight: 700;">
              ${productName}
            </h3>
            <div style="font-size: 14px; color: #555;">
              <strong>Quantity:</strong> <span style="font-weight: 800; color: #000;">${qty} Pc</span> &nbsp;|&nbsp; 
              <strong>Amount:</strong> <span style="font-weight: 900; color: #155724; font-size: 16px;">₹${amount}</span>
            </div>
            <div style="margin-top: 6px; font-size: 12px; color: #777;">
              <strong>Date:</strong> ${dateStr} &nbsp;|&nbsp; <strong>Sync Status:</strong> <span style="color: #28a745; font-weight: bold;">✓ Added to Sale Sheet (automated)</span>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Customer Delivery Details -->
    <div style="padding: 20px 24px; background: #fafbfc; border-bottom: 1px solid #edf0f2;">
      <h4 style="margin: 0 0 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #666;">
        📍 Delivery Destination Details
      </h4>
      <div style="font-size: 14px; line-height: 1.5; color: #222;">
        <strong>Customer:</strong> ${customerName}<br>
        <strong>Phone:</strong> <a href="tel:${phone}" style="color: #2C3E2E; font-weight: bold; text-decoration: none;">${phone}</a><br>
        <strong>Address:</strong> ${address}<br>
        <strong>Pincode:</strong> <span style="font-weight: 900; font-size: 15px; background: #fff; border: 1px solid #ddd; padding: 2px 8px; border-radius: 4px;">${pincode}</span>
      </div>
    </div>

    <!-- Interactive Action Buttons -->
    <div style="padding: 24px; text-align: center; background: #ffffff;">
      <div style="font-size: 13px; font-weight: 600; color: #555; margin-bottom: 16px;">
        👇 Click an action below to process this order instantly:
      </div>
      <table style="width: 100%; border-collapse: separate; border-spacing: 12px 0;">
        <tr>
          <!-- Button 1: Accept Order -->
          <td style="width: 50%;">
            <a href="${acceptUrl}" target="_blank" style="display: block; background: #f0f4f0; color: #2C3E2E; border: 2px solid #2C3E2E; padding: 14px 10px; text-align: center; border-radius: 8px; font-weight: 800; font-size: 14px; text-decoration: none; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
              ✅ Accept Order
            </a>
          </td>
          <!-- Button 2: Accept & Generate Shipping Label -->
          <td style="width: 50%;">
            <a href="${labelUrl}" target="_blank" style="display: block; background: #2C3E2E; color: #ffffff; border: 2px solid #2C3E2E; padding: 14px 10px; text-align: center; border-radius: 8px; font-weight: 800; font-size: 14px; text-decoration: none; box-shadow: 0 4px 12px rgba(44,62,46,0.3);">
              🏷️ Accept & Generate Label
            </a>
          </td>
        </tr>
      </table>
      <div style="margin-top: 14px; font-size: 11px; color: #888;">
        Clicking <strong>'Accept & Generate Label'</strong> will mark the order accepted, create the 4x6 courier shipping slip, and email it back to you instantly.
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #2C3E2E; padding: 14px; text-align: center; color: #D4AF37; font-size: 11px;">
      Nyara Luxe Order Automation Engine | Sheet: Buy and Sell (sale tab)
    </div>
  </div>
</body>
</html>`;
}

function generateShippingLabelHtml(order, isEmail = false) {
  const orderId = order.orderId || 'NL-ORD-0000';
  const customerName = order.customerName || order.name || 'Valued Customer';
  const customerPhone = order.customerPhone || order.phone || 'N/A';
  const deliveryAddress = order.deliveryAddress || order.address || 'N/A';
  const pincode = order.pincode || 'N/A';
  const productSku = order.productSku || order.sku || 'N/A';
  const productName = order.productName || 'Lighting / Decor Fixture';
  const qty = Number(order.quantity || order.qty) || 1;
  const amount = order.amount || order.price || 0;
  const paymentStatus = order.paymentStatus || (order.paymentId ? 'PREPAID' : 'COD');
  const orderDate = order.orderDate || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const qrData = `${orderId}|${pincode}|${productSku}`;
  const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(qrData)}&size=130&margin=1`;

  const printBtn = !isEmail ? `
    <div class="no-print" style="text-align: center; margin-bottom: 20px;">
      <button onclick="window.print()" style="background: #2C3E2E; color: #FFF; border: none; padding: 12px 28px; font-size: 16px; font-weight: bold; border-radius: 6px; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
        🖨️ Print Shipping Label (4x6 / A4)
      </button>
      <span style="display: block; margin-top: 6px; font-size: 12px; color: #666;">Tip: Set Margins to 'None' and enable 'Background Graphics' in print dialog.</span>
    </div>` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Shipping Label - ${orderId}</title>
  <style>
    @page {
      size: 4in 6in;
      margin: 0;
    }
    @media print {
      .no-print { display: none !important; }
      body { margin: 0; padding: 0; background: #fff !important; }
      .label-container { border: 2px solid #000 !important; box-shadow: none !important; width: 3.8in !important; margin: 0 auto !important; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      background: #f0f2f5;
      margin: 0;
      padding: 20px;
      color: #000;
    }
    .label-container {
      width: 380px;
      margin: 0 auto;
      background: #fff;
      border: 2px solid #000;
      border-radius: 4px;
      padding: 14px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      box-sizing: border-box;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #000;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .brand-name {
      font-size: 18px;
      font-weight: 900;
      letter-spacing: 1px;
      color: #111;
    }
    .brand-sub {
      font-size: 9px;
      color: #444;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-express {
      background: #000;
      color: #fff;
      font-size: 11px;
      font-weight: bold;
      padding: 4px 8px;
      border-radius: 3px;
      text-transform: uppercase;
    }
    .routing-section {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #000;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .routing-pin {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: 1px;
    }
    .routing-meta {
      font-size: 11px;
      line-height: 1.4;
      text-align: right;
    }
    .ship-to {
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
      margin-bottom: 8px;
    }
    .ship-to-title {
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      color: #555;
      margin-bottom: 3px;
    }
    .cust-name {
      font-size: 15px;
      font-weight: 800;
      margin-bottom: 4px;
    }
    .cust-address {
      font-size: 12px;
      line-height: 1.35;
      color: #222;
    }
    .cust-phone {
      font-size: 13px;
      font-weight: 700;
      margin-top: 4px;
    }
    .item-details {
      border-bottom: 2px solid #000;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .sku-badge {
      display: inline-block;
      background: #eef2ef;
      border: 1px solid #2C3E2E;
      color: #2C3E2E;
      font-weight: 900;
      font-size: 14px;
      padding: 3px 8px;
      border-radius: 4px;
      margin-bottom: 4px;
    }
    .item-table {
      width: 100%;
      font-size: 11px;
      border-collapse: collapse;
      margin-top: 4px;
    }
    .item-table td {
      padding: 2px 0;
    }
    .barcode-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #000;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .qr-img {
      width: 90px;
      height: 90px;
      border: 1px solid #ddd;
    }
    .order-barcode {
      flex: 1;
      padding-left: 12px;
      text-align: center;
    }
    .barcode-lines {
      height: 38px;
      background: repeating-linear-gradient(90deg, #000 0, #000 2px, #fff 2px, #fff 4px, #000 4px, #000 7px, #fff 7px, #fff 9px, #000 9px, #000 13px, #fff 13px, #fff 15px);
      margin-bottom: 4px;
      border-radius: 2px;
    }
    .barcode-text {
      font-size: 11px;
      font-weight: bold;
      letter-spacing: 2px;
      font-family: monospace;
    }
    .ship-from {
      font-size: 10px;
      line-height: 1.35;
      color: #444;
      border-bottom: 1px dashed #666;
      padding-bottom: 6px;
      margin-bottom: 6px;
    }
    .instructions {
      text-align: center;
      font-size: 11px;
      font-weight: 800;
      color: #b00;
      letter-spacing: 0.5px;
      padding-top: 2px;
    }
  </style>
</head>
<body>
  ${printBtn}
  <div class="label-container">
    <div class="header">
      <div>
        <div class="brand-name">NYARA LUXE</div>
        <div class="brand-sub">Premium Home Decor & Lighting</div>
      </div>
      <div class="badge-express">${paymentStatus}</div>
    </div>

    <div class="routing-section">
      <div>
        <div style="font-size: 9px; text-transform: uppercase; color: #555;">Destination Pincode</div>
        <div class="routing-pin">${pincode}</div>
      </div>
      <div class="routing-meta">
        <div><strong>Date:</strong> ${orderDate}</div>
        <div><strong>Order:</strong> ${orderId}</div>
        <div><strong>Carrier:</strong> Surface Express</div>
      </div>
    </div>

    <div class="ship-to">
      <div class="ship-to-title">Deliver To (Consignee):</div>
      <div class="cust-name">${customerName}</div>
      <div class="cust-address">${deliveryAddress}</div>
      <div class="cust-phone">📞 Phone: ${customerPhone}</div>
    </div>

    <div class="item-details">
      <div style="font-size: 9px; text-transform: uppercase; color: #555; margin-bottom: 2px;">Item Dispatch Info:</div>
      <span class="sku-badge">SKU: ${productSku}</span>
      <table class="item-table">
        <tr>
          <td style="color:#555;">Description:</td>
          <td style="font-weight:600; text-align:right;">${productName}</td>
        </tr>
        <tr>
          <td style="color:#555;">Quantity:</td>
          <td style="font-weight:700; text-align:right;">${qty} Pc</td>
        </tr>
        <tr>
          <td style="color:#555;">Amount:</td>
          <td style="font-weight:700; text-align:right;">₹${amount}</td>
        </tr>
      </table>
    </div>

    <div class="barcode-section">
      <img class="qr-img" src="${qrUrl}" alt="QR Tracking">
      <div class="order-barcode">
        <div class="barcode-lines"></div>
        <div class="barcode-text">*${orderId}*</div>
      </div>
    </div>

    <div class="ship-from">
      <strong>Shipped By (Return Address):</strong><br>
      NYARA LUXE FULFILLMENT CENTER<br>
      Email: info@nyaraluxe.in | Web: www.nyaraluxe.in
    </div>

    <div class="instructions">
      ⚠️ FRAGILE - HANDLE WITH CARE - GLASS & LIGHTING
    </div>
  </div>
</body>
</html>`;
}

function generateOrderConfirmationEmail(order) {
  const orderId = order.orderId || 'NL-ORD-0000';
  const customerName = order.customerName || order.name || 'Valued Customer';
  const productName = order.productName || 'Nyara Luxe Item';
  const amount = order.amount || 0;
  const address = order.deliveryAddress || order.address || '';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background: #2C3E2E; color: #D4AF37; padding: 25px 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 2px;">NYARA LUXE</h1>
        <p style="margin: 5px 0 0; color: #ffffff; font-size: 13px;">Premium Home Decor & Lighting</p>
      </div>
      <div style="padding: 25px;">
        <h2 style="color: #2C3E2E; font-size: 20px; margin-top: 0;">Order Confirmed! 🎉</h2>
        <p style="color: #444; font-size: 15px; line-height: 1.5;">Dear <strong>${customerName}</strong>, thank you for your order with Nyara Luxe! Your package is being prepared for dispatch.</p>
        
        <div style="background: #f9fbf9; border: 1px solid #e5ebe5; border-radius: 6px; padding: 15px; margin: 20px 0;">
          <h3 style="color: #2C3E2E; margin: 0 0 10px; font-size: 16px;">Order Details</h3>
          <p style="margin: 4px 0; color: #555;"><strong>Order ID:</strong> ${orderId}</p>
          <p style="margin: 4px 0; color: #555;"><strong>Product:</strong> ${productName}</p>
          <p style="margin: 4px 0; color: #555;"><strong>Amount Paid:</strong> ₹${amount}</p>
          <p style="margin: 4px 0; color: #555;"><strong>Delivery Address:</strong> ${address}</p>
        </div>

        <p style="color: #666; font-size: 13px; line-height: 1.4;">Need help with your order? Reply directly to this email or reach us at <a href="mailto:info@nyaraluxe.in" style="color: #2C3E2E;">info@nyaraluxe.in</a>.</p>
      </div>
      <div style="background: #f4f4f4; padding: 12px; text-align: center; color: #777; font-size: 12px;">
        © ${new Date().getFullYear()} Nyara Luxe. All rights reserved.
      </div>
    </div>
  `;
}


function generateBatchShippingLabelsHtml(orders, isEmail = false) {
  if (!Array.isArray(orders) || orders.length === 0) {
    return '<html><body><h2 style="text-align:center;font-family:sans-serif;margin-top:50px;">No orders available for shipping label generation.</h2></body></html>';
  }

  const labelPages = orders.map((ord, idx) => {
    return `
      <div class="label-container-wrapper" style="page-break-after: always; margin-bottom: 30px;">
        ${generateShippingLabelHtml(ord, true)}
      </div>
    `;
  }).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Batch Shipping Labels - ${orders.length} Orders - Nyara Luxe</title>
  <style>
    @page {
      size: 4in 6in;
      margin: 0;
    }
    @media print {
      body {
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
      }
      .no-print {
        display: none !important;
      }
      .label-container-wrapper {
        page-break-after: always !important;
        margin: 0 !important;
        box-shadow: none !important;
      }
    }
    body {
      background: #eef2f5;
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
  </style>
</head>
<body>
  ${!isEmail ? `
    <div class="no-print" style="text-align: center; margin-bottom: 25px; background: #fff; padding: 15px 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <h2 style="margin: 0 0 10px; color: #2C3E2E;">📦 Batch Shipping Labels (${orders.length} Packages)</h2>
      <button onclick="window.print()" style="background: #2C3E2E; color: #FFF; border: none; padding: 12px 30px; font-size: 16px; font-weight: bold; border-radius: 6px; cursor: pointer;">
        🖨️ Print All Shipping Labels
      </button>
      <span style="display: block; margin-top: 6px; font-size: 12px; color: #666;">Tip: Set printer paper size to 4x6 inch (or A6) & margins to 'None'.</span>
    </div>
  ` : ''}

  ${labelPages}
</body>
</html>`;
}

function generateBatchOrderEmail(orders, baseUrl = 'https://website-ppur.vercel.app') {
  const count = orders.length;
  const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const batchLabelUrl = `${baseUrl}/api/orders/batch-labels-view`;

  const rows = orders.map((ord, idx) => {
    const plat = (ord.platform || 'WEBSITE').toUpperCase();
    const platColor = plat === 'FLIPKART' ? '#2874F0' : (plat === 'MEESHO' ? '#9C27B0' : '#FF9900');
    const img = ord.imageUrl || 'https://res.cloudinary.com/dgn1wdfdw/image/upload/v1775405892/nyara-luxe-uploads/mphweysnpgmavfe4rlvi.png';
    return `
      <tr style="border-bottom: 1px solid #e0e0e0;">
        <td style="padding: 12px 8px; text-align: center;">
          <img src="${img}" alt="${ord.productSku}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid #ddd;">
        </td>
        <td style="padding: 12px 8px;">
          <span style="background: ${platColor}; color: #fff; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 3px;">${plat}</span><br>
          <strong style="color: #2C3E2E; font-size: 13px;">${ord.productSku}</strong><br>
          <span style="color: #666; font-size: 11px;">${ord.productName || 'Fixture'}</span>
        </td>
        <td style="padding: 12px 8px; font-size: 12px; color: #333;">
          <strong>${ord.orderId}</strong><br>
          Qty: ${ord.quantity || 1} | ₹${ord.amount || 0}
        </td>
        <td style="padding: 12px 8px; font-size: 11px; color: #555;">
          <strong>${ord.customerName || 'Valued Customer'}</strong><br>
          ${ord.deliveryAddress || ''} (${ord.pincode || ''})
        </td>
        <td style="padding: 12px 8px; text-align: center;">
          <a href="${baseUrl}/api/orders/${ord.orderId}/label" style="display: inline-block; background: #2C3E2E; color: #fff; text-decoration: none; font-size: 11px; font-weight: bold; padding: 6px 10px; border-radius: 4px;">🏷️ Label</a>
        </td>
      </tr>
    `;
  }).join('\n');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 750px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background: #2C3E2E; color: #D4AF37; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 22px; font-weight: bold; letter-spacing: 2px;">NYARA LUXE</h1>
        <p style="margin: 4px 0 0; color: #ffffff; font-size: 13px;">Daily Automated Dispatch Pack &bull; ${todayStr}</p>
      </div>

      <div style="padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; background: #f8faf8; padding: 15px; border-radius: 6px; border: 1px solid #e0e8e0;">
          <div>
            <h3 style="margin: 0; color: #2C3E2E; font-size: 18px;">📦 ${count} Orders Accepted & Processed</h3>
            <p style="margin: 4px 0 0; color: #666; font-size: 13px;">All shipping labels have been compiled and generated.</p>
          </div>
          <div>
            <a href="${batchLabelUrl}" style="background: #D4AF37; color: #2C3E2E; text-decoration: none; font-weight: bold; padding: 10px 18px; border-radius: 6px; font-size: 14px; display: inline-block;">🖨️ Print All Labels</a>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background: #f1f4f1; color: #2C3E2E; font-size: 12px; text-transform: uppercase;">
              <th style="padding: 10px 8px; text-align: center;">Photo</th>
              <th style="padding: 10px 8px; text-align: left;">Product & SKU</th>
              <th style="padding: 10px 8px; text-align: left;">Order Details</th>
              <th style="padding: 10px 8px; text-align: left;">Customer Address</th>
              <th style="padding: 10px 8px; text-align: center;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div style="margin-top: 30px; text-align: center;">
          <a href="${batchLabelUrl}" style="background: #2C3E2E; color: #fff; text-decoration: none; font-weight: bold; padding: 14px 28px; border-radius: 6px; font-size: 16px; display: inline-block;">
            🖨️ Open All ${count} Printable Shipping Labels (4x6 / A4)
          </a>
        </div>
      </div>

      <div style="background: #f4f4f4; padding: 12px; text-align: center; color: #777; font-size: 12px;">
        &copy; ${new Date().getFullYear()} Nyara Luxe Order Automation Engine.
      </div>
    </div>
  `;
}

module.exports = {
  generateBatchShippingLabelsHtml,
  generateBatchOrderEmail,
  generateShippingLabelHtml,
  generateMarketplaceOrderEmail,
  generateOrderConfirmationEmail
};
