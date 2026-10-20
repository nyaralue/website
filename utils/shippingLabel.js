/**
 * Shipping Label & Email Template Generator for Nyara Luxe
 * Generates standard 4x6 / A6 e-commerce compliant shipping dispatch slips.
 */

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
  const labelUrl = order.shippingLabelUrl || `/api/orders/${orderId}/label`;

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

module.exports = {
  generateShippingLabelHtml,
  generateOrderConfirmationEmail
};
