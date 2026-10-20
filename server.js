require('dotenv').config();
process.env.CLOUDINARY_URL = process.env.CLOUDINARY_URL || 'cloudinary://293619391832524:7beZcA_4tDqvZB8L0jV_32Gfk4E@dgn1wdfdw';

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { google } = require('googleapis');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const nodemailer = require('nodemailer');

// Import Models
const Product = require('./models/Product');
const Admin = require('./models/Admin');
const HelpRequest = require('./models/HelpRequest');
const SKU = require('./models/SKU');
const Category = require('./models/Category');
const ChatSession = require('./models/ChatSession');
const Order = require('./models/Order');
const { generateShippingLabelHtml, generateMarketplaceOrderEmail, generateOrderConfirmationEmail, generateBatchShippingLabelsHtml, generateBatchOrderEmail } = require('./utils/shippingLabel');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'nyara-luxe-secret-key-change-in-production';
// Fallback to hardcoded URI if env var is missing (Temporary fix for Vercel issue)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://info_db_user:DtBE84LlLUD6yaEg@free.ltju6fx.mongodb.net/?appName=Free';

// Cached MongoDB connection for serverless
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not defined. Please check your .env file or Vercel project settings.');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable buffering to fail fast if not connected
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('New MongoDB connection established');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Configure Cloudinary
process.env.CLOUDINARY_URL = process.env.CLOUDINARY_URL || 'cloudinary://293619391832524:7beZcA_4tDqvZB8L0jV_32Gfk4E@dgn1wdfdw';

if (process.env.CLOUDINARY_URL) {
  console.log('Cloudinary configured');
} else {
  console.warn('CLOUDINARY_URL not found. Image uploads may fail.');
}

// Configure Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'nyara-luxe-uploads',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'mp4', 'mov', 'avi', 'webm'],
    resource_type: 'auto', // Allow both images and videos
  },
});

const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Google Search Console verification route
app.get('/googlecc3ef0e6b05ddc02.html', (req, res) => {
  res.send('google-site-verification: googlecc3ef0e6b05ddc02.html');
});

// Route for product.html to inject OG tags
app.get('/product.html', async (req, res) => {
  try {
    const filePath = path.join(__dirname, 'public', 'product-template.html');
    let html = await fs.readFile(filePath, 'utf8');
    
    const productId = req.query.id;
    if (productId) {
      await connectDB();
      const product = await Product.findOne({ id: productId }) || await Product.findOne({ sku: productId });
      
      if (product) {
        const title = product.name || 'Nyara Luxe Product';
        const description = (product.description || 'Discover luxury home products from Nyara Luxe.').substring(0, 150);
        let image = (product.media && product.media.length > 0) ? product.media[0] : 'https://website-ppur.vercel.app/new%20logo.png';
        
        // Format Cloudinary images for WhatsApp (Must be < 300KB and ideally JPG)
        if (image.includes('res.cloudinary.com') && image.includes('/upload/')) {
          image = image.replace('/upload/', '/upload/w_600,q_auto:low,f_jpg/');
        }
        
        const ogTags = `
    <meta property="og:title" content="${title.replace(/"/g, '&quot;')}" />
    <meta property="og:description" content="${description.replace(/"/g, '&quot;')}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:type" content="product" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${image}" />
        `;
        
        // Inject right before </head>
        html = html.replace('</head>', `${ogTags}</head>`);
      }
    }
    res.send(html);
  } catch (error) {
    console.error('Error serving dynamic product.html:', error);
    // Fallback to static file
    res.sendFile(path.join(__dirname, 'public', 'product-template.html'));
  }
});

// Use absolute path for static files to ensure Vercel finds them
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Google Sheets configuration (Defaulted to primary Buy & Sell sheet 1TMh-4V0YQWWRsNBb_b0nx_WwQWc5YQ5ADCB0iAC9ksw)
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID || '1TMh-4V0YQWWRsNBb_b0nx_WwQWc5YQ5ADCB0iAC9ksw';
const GOOGLE_SHEET_RANGE = 'sale';

// Function to authenticate with Google Sheets API
async function getGoogleSheetsClient() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, 'config', 'service-account-key.json'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    const client = await auth.getClient();
    return google.sheets({ version: 'v4', auth: client });
  } catch (error) {
    console.error('Error authenticating with Google Sheets API:', error);
    return null;
  }
}

// Function to append data to Google Sheet ('sale' sheet for inventory sync, 'Customer Queries' for chat)
async function appendToGoogleSheet(data) {
  try {
    const isOrder = data.type === 'order' || (!data.type && (data.productName || data.productSku || data.orderId));
    const now = new Date();
    const todayIso = data.orderDate || now.toISOString().split('T')[0];
    const sku = (data.productSku || data.sku || data.productName || 'UNKNOWN_SKU').trim();
    const qty = Number(data.quantity || data.qty) || 1;
    const amount = Number(data.amount || data.price) || 0;
    const orderId = String(data.orderId || ('NL-' + Date.now())).trim();
    const packetId = String(data.packetId || data.packetQR || '').trim();
    const remark = data.remark || 'automated';

    // 1. Post to Apps Script Webhook (24/7 serverless webhook execution)
    const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycby-FrzY1eR_HkUJTDA7Wo4LSNRt8oFiiIULSH_iaD4/exec';
    if (webhookUrl) {
      try {
        const webhookPayload = isOrder ? {
          type: 'order',
          sku: sku,
          productSku: sku,
          quantity: qty,
          platform: data.platform || 'website',
          amount: amount,
          orderId: orderId,
          packetId: packetId,
          orderDate: todayIso,
          amountRecieved: 'Yes',
          paymentDate: todayIso,
          remark: remark,
          name: data.customerName || data.name || '',
          phone: data.customerPhone || data.phone || '',
          address: data.deliveryAddress || data.address || '',
          pincode: data.pincode || ''
        } : data;

        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload)
        });
        console.log(`[Google Sheet Sync] Order ${orderId} sent to Google Sheet Webhook`);
      } catch (err) {
        console.error('Error posting to Google Sheet Webhook:', err.message);
      }
    }

    // 2. Direct Append via Google Sheets API if service account client is available
    const sheets = await getGoogleSheetsClient();
    if (sheets && data.type !== 'chat_online') {
      let targetRange = null;
      let values = [];

      if (data.type === 'chat_query' || data.sheetName === 'Customer Queries') {
        targetRange = 'Customer Queries';
        values = [
          [
            new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            data.category || 'General Query',
            data.name || 'Website Visitor',
            data.phone || data.email || 'Not provided',
            data.rawQuery || data.query || '',
            data.pageUrl || ''
          ]
        ];
      } else if (isOrder) {
        // Appending directly to 'sale' sheet in Buy & Sell spreadsheet
        targetRange = 'sale!A:J';
        values = [
          [
            sku,
            qty,
            data.platform || 'website',
            amount,
            orderId,
            packetId,
            todayIso,
            'Yes',
            todayIso,
            remark
          ]
        ];
      }

      if (targetRange && values.length > 0) {
        try {
          await sheets.spreadsheets.values.append({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: targetRange,
            valueInputOption: 'USER_ENTERED',
            resource: { values: values }
          });
          console.log(`[Google Sheet API] Row appended to ${targetRange}`);
        } catch (sheetsErr) {
          console.log('Google Sheets API append info:', sheetsErr.message);
        }
      }
    }

    return { success: true, message: 'Order submitted to Google Sheet.' };

  } catch (error) {
    console.error('Error appending to Google Sheet:', error);
    return { success: false, message: 'Error processing submission.' };
  }
}

// Save to MongoDB (replacement for local file)
async function saveToMongoDB(data) {
  try {
    await connectDB();
    const newRequest = new HelpRequest(data);
    await newRequest.save();
    return { success: true, message: 'Your query has been submitted successfully.' };
  } catch (error) {
    console.error('Error saving to MongoDB:', error);
    return { success: false, message: 'Sorry, there was an error submitting your query.' };
  }
}

// Initialize Admin User (if not exists)
async function initializeAdmin() {
  try {
    await connectDB();
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash('Bawalibuch@123', 10);
      const admin = new Admin({
        username: 'UjjwalSinghi978',
        password: hashedPassword
      });
      await admin.save();
      console.log('Default admin created');
    }
  } catch (error) {
    console.error('Error initializing admin:', error);
  }
}

// Initialize Default Categories (if not exists)
async function initializeCategories() {
  try {
    await connectDB();
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      const defaultCategories = [
        { name: 'chandelier', displayName: 'Chandelier', icon: 'fa-lightbulb' },
        { name: 'lights', displayName: 'Lights & Lamps', icon: 'fa-lightbulb' },
        { name: 'decors', displayName: 'Decors Showpieces', icon: 'fa-gem' },
        { name: 'functional', displayName: 'Functional Mini Decor', icon: 'fa-box-open' }
      ];

      await Category.insertMany(defaultCategories);
      console.log('Default categories created');
    }
  } catch (error) {
    console.error('Error initializing categories:', error);
  }
}

// Middleware to verify JWT token
function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = decoded;
    next();
  });
}

// Routes

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    await connectDB();
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ username: admin.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all products (grouped by category for frontend compatibility)
app.get('/api/products', async (req, res) => {
  try {
    await connectDB();
    console.log('Fetching products...');
    let products = await Product.find().sort({ sku: 1 });
    console.log(`Found ${products.length} products`);

    // Define custom category order
    const categoryOrder = [
      'wall-lights',
      'chandelier',
      'garden-&-pendant-lights',
      'rugs-&-carpets',
      'cushion-covers'
    ];

    // Sort products by category order first (stable sort maintains sku order)
    products.sort((a, b) => {
      const idxA = categoryOrder.indexOf(a.category);
      const idxB = categoryOrder.indexOf(b.category);
      const orderA = idxA !== -1 ? idxA : 999;
      const orderB = idxB !== -1 ? idxB : 999;
      return orderA - orderB;
    });

    // Group by category to match old structure: { categories: { light: [], ... } }
    const grouped = { categories: {} };
    products.forEach(p => {
      if (!grouped.categories[p.category]) {
        grouped.categories[p.category] = [];
      }
      grouped.categories[p.category].push(p);
    });
    res.json(grouped);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products', details: error.message });
  }
});

// Get products by category
app.get('/api/products/:category', async (req, res) => {
  try {
    await connectDB();
    const category = req.params.category;
    const products = await Product.find({ category }).sort({ sku: 1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product by ID (custom string id or MongoDB _id)
app.get('/api/product/:id', async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    
    // Try to find by custom id field first, then by MongoDB _id
    let product = await Product.findOne({ id: id });
    if (!product) {
      // Check if it's a valid MongoDB ObjectId before querying
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(id)) {
        product = await Product.findById(id);
      }
    }
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Upload files (Admin only)
app.post('/api/upload', verifyToken, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Cloudinary returns the URL in file.path
    const fileUrls = req.files.map(file => file.path);
    res.json({ urls: fileUrls, message: 'Files uploaded successfully' });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload files: ' + error.message });
  }
});

// Add product (Admin only)
app.post('/api/products', verifyToken, async (req, res) => {
  try {
    await connectDB();
    const { category, product } = req.body;

    // Create new product
    const newProduct = new Product({
      id: Date.now().toString(), // Keep string ID for frontend compatibility
      category,
      ...product
    });

    await newProduct.save();
    res.json({ message: 'Product added successfully', product: newProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// Update product (Admin only)
app.put('/api/products/:category/:id', verifyToken, async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const updatedData = req.body;

    const product = await Product.findByIdAndUpdate(id, updatedData, { new: true });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product (Admin only)
app.delete('/api/products/:category/:id', verifyToken, async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const result = await Product.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Get categories
app.get('/api/categories', async (req, res) => {
  try {
    await connectDB();
    const categories = await Category.find();

    const categoryOrder = [
      'wall-lights',
      'chandelier',
      'garden-&-pendant-lights',
      'rugs-&-carpets',
      'cushion-covers'
    ];

    categories.sort((a, b) => {
      const idxA = categoryOrder.indexOf(a.name);
      const idxB = categoryOrder.indexOf(b.name);
      const orderA = idxA !== -1 ? idxA : 999;
      const orderB = idxB !== -1 ? idxB : 999;
      return orderA - orderB;
    });

    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Add new category (Admin only)
app.post('/api/categories', verifyToken, async (req, res) => {
  try {
    await connectDB();
    const { name, displayName, icon } = req.body;

    if (!name || !displayName) {
      return res.status(400).json({ error: 'Name and display name are required' });
    }

    // Check if category already exists
    const existing = await Category.findOne({ name: name.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    const category = new Category({
      name: name.toLowerCase(),
      displayName,
      icon: icon || 'fa-box'
    });

    await category.save();
    res.json({ message: 'Category added successfully', category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add category' });
  }
});

// Delete category (Admin only)
app.delete('/api/categories/:id', verifyToken, async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Update category (Admin only)
app.put('/api/categories/:id', verifyToken, async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const { name, displayName, icon } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const oldName = category.name;
    const newName = name ? name.toLowerCase() : oldName;

    // If name is changing, check for duplicates
    if (newName !== oldName) {
      const existing = await Category.findOne({ name: newName });
      if (existing) {
        return res.status(400).json({ error: 'Category ID already exists' });
      }
    }

    category.name = newName;
    category.displayName = displayName || category.displayName;
    category.icon = icon || category.icon;

    await category.save();

    // If name changed, update all associated products
    if (newName !== oldName) {
      await Product.updateMany({ category: oldName }, { category: newName });
    }

    res.json({ message: 'Category updated successfully', category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// SKU Management APIs

// Get all SKUs
app.get('/api/skus', verifyToken, async (req, res) => {
  try {
    await connectDB();
    const skus = await SKU.find().sort({ createdAt: -1 });
    res.json(skus);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch SKUs' });
  }
});

// Get available (unassigned) SKUs
app.get('/api/skus/available', verifyToken, async (req, res) => {
  try {
    await connectDB();
    const skus = await SKU.find({ isAssigned: false }).sort({ createdAt: -1 });
    res.json(skus);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch available SKUs' });
  }
});

// Add new SKU (Admin only)
app.post('/api/skus', verifyToken, async (req, res) => {
  try {
    await connectDB();
    const { skuId, description } = req.body;

    if (!skuId) {
      return res.status(400).json({ error: 'SKU ID is required' });
    }

    // Check if SKU already exists
    const existing = await SKU.findOne({ skuId });
    if (existing) {
      return res.status(400).json({ error: 'SKU ID already exists' });
    }

    const sku = new SKU({
      skuId,
      description: description || '',
      isAssigned: false
    });

    await sku.save();
    res.json({ message: 'SKU added successfully', sku });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add SKU' });
  }
});

// Update SKU assignment status
app.put('/api/skus/:skuId/assign', verifyToken, async (req, res) => {
  try {
    await connectDB();
    const { skuId } = req.params;
    const { productId, isAssigned } = req.body;

    const sku = await SKU.findOne({ skuId });
    if (!sku) {
      return res.status(404).json({ error: 'SKU not found' });
    }

    sku.isAssigned = isAssigned;
    sku.assignedToProduct = isAssigned ? productId : null;
    await sku.save();

    res.json({ message: 'SKU updated successfully', sku });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update SKU' });
  }
});
// Serve admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Function to send email notification for orders and inquiries to ujjwaljaini978@gmail.com (Runs 24/7 on Vercel Cloud)
async function sendNotificationEmail(orderData, baseUrl = 'https://website-ppur.vercel.app') {
  const recipientEmail = 'ujjwaljaini978@gmail.com';
  const labelUrl = orderData.shippingLabelUrl || `${baseUrl}/api/orders/${orderData.orderId}/label`;
  const richOrderHtml = generateMarketplaceOrderEmail(orderData, baseUrl);

  // 1. Direct Cloud Delivery via FormSubmit (Fail-safe for serverless Vercel)
  try {
    const formSubmitPayload = {
      _subject: `📦 [${(orderData.platform || 'ORDER').toUpperCase()}] ${orderData.orderId}: ${orderData.productSku} - ${orderData.productName}`,
      _template: 'table',
      _captcha: 'false',
      _cc: 'info@nyaraluxe.in',
      'Platform': (orderData.platform || 'Website').toUpperCase(),
      'Order ID': orderData.orderId || 'N/A',
      'Product SKU': orderData.productSku || 'N/A',
      'Product Name': orderData.productName || 'N/A',
      'Product Image': orderData.imageUrl || 'N/A',
      'Quantity': orderData.quantity || 1,
      'Amount': `₹${orderData.amount || 0}`,
      'Payment Status': orderData.paymentStatus || 'PREPAID',
      'Customer Name': orderData.customerName || orderData.name || 'N/A',
      'Customer Phone': orderData.customerPhone || orderData.phone || 'N/A',
      'Delivery Address': orderData.deliveryAddress || orderData.address || 'N/A',
      'Pincode': orderData.pincode || 'N/A',
      'Action Accept Order': `${baseUrl}/api/orders/action?orderId=${encodeURIComponent(orderData.orderId)}&action=accept`,
      'Action Accept & Print Label': `${baseUrl}/api/orders/action?orderId=${encodeURIComponent(orderData.orderId)}&action=accept_label`,
      'Printable Shipping Label': labelUrl,
      'Sheet Remark': 'automated'
    };

    await fetch(`https://formsubmit.co/ajax/${recipientEmail}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Nyara-Luxe-Serverless',
        'Referer': 'https://website-ppur.vercel.app/',
        'Origin': 'https://website-ppur.vercel.app'
      },
      body: JSON.stringify(formSubmitPayload)
    });
    console.log(`[Email Notification] FormSubmit order email delivered to ${recipientEmail}`);
  } catch (fsErr) {
    console.error('FormSubmit delivery error:', fsErr.message);
  }

  // 2. SMTP Delivery with Product Photo & Interactive Accept / Label Buttons
  try {
    const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '465');
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: true,
        auth: { user: smtpUser, pass: smtpPass }
      });

      const platUpper = String(orderData.platform || 'website').toUpperCase();
      const mailOptions = {
        from: `"Nyara Luxe Orders" <${smtpUser}>`,
        to: `${recipientEmail}, info@nyaraluxe.in`,
        subject: `🏷️ [${platUpper}] ${orderData.orderId}: ${orderData.productSku} (${orderData.customerName || orderData.name || 'Customer'})`,
        html: richOrderHtml
      };

      await transporter.sendMail(mailOptions);
      console.log(`[SMTP Notification] Rich order email with product photo delivered to ${recipientEmail}`);

      // Also send customer confirmation email if customer email exists
      const custEmail = orderData.customerEmail || orderData.email;
      if (custEmail && custEmail.includes('@') && !custEmail.includes('example.com')) {
        try {
          const custMailOptions = {
            from: `"Nyara Luxe" <${smtpUser}>`,
            to: custEmail,
            subject: `✨ Order Confirmed: Your Nyara Luxe Order [${orderData.orderId}]`,
            html: generateOrderConfirmationEmail(orderData)
          };
          await transporter.sendMail(custMailOptions);
          console.log(`[Customer Notification] Order confirmation sent to ${custEmail}`);
        } catch (custErr) {
          console.error('Customer email delivery error:', custErr.message);
        }
      }
    }
  } catch (err) {
    console.error('Failed to send SMTP notification email:', err.message);
  }
}
// -----------------------------------------------------------------------------
// Dedicated Checkout Form & Order Processing Endpoint
// -----------------------------------------------------------------------------
app.post('/api/checkout-submit', async (req, res) => {
  try {
    await connectDB();
    const {
      productName,
      productSku,
      productId,
      name,
      phone,
      address,
      pincode,
      email,
      locationLink,
      query,
      timestamp,
      quantity,
      amount,
      paymentId
    } = req.body;

    // 1. Resolve exact SKU ID matching Buy & Sell inventory
    let finalSku = (productSku || productId || '').trim();
    let productDoc = null;

    if (productId || productSku || productName) {
      try {
        productDoc = await Product.findOne({
          $or: [
            { sku: finalSku },
            { id: productId },
            { id: finalSku },
            { name: productName }
          ]
        });
        if (productDoc && productDoc.sku) {
          finalSku = productDoc.sku.trim();
        }
      } catch (pErr) {
        console.log('Product SKU resolution note:', pErr.message);
      }
    }

    if (!finalSku || finalSku === 'unknown' || finalSku === 'N/A') {
      finalSku = productName ? productName.slice(0, 30) : 'PROD_GENERIC';
    }

    // 2. Generate standard Order ID
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const isoDateStr = now.toISOString().split('T')[0]; // 'YYYY-MM-DD' for Google Sheet formulas
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = paymentId ? `NL-${paymentId.slice(-8).toUpperCase()}` : `NL-ORD-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${randomSuffix}`;

    const parsedQty = parseInt(quantity) || 1;
    let parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      parsedAmount = productDoc && productDoc.price ? productDoc.price : 0;
    }

    const host = req.get('host') || 'website-ppur.vercel.app';
    const protocol = req.protocol === 'https' || host.includes('vercel.app') ? 'https' : 'http';
    const labelUrl = `${protocol}://${host}/api/orders/${orderId}/label`;

    const orderData = {
      orderId,
      productId: productId || (productDoc ? productDoc.id : ''),
      productName: productName || (productDoc ? productDoc.name : 'Nyara Luxe Fixture'),
      productSku: finalSku,
      quantity: parsedQty,
      amount: parsedAmount,
      customerName: name || 'Customer',
      customerPhone: phone || '',
      customerEmail: email || '',
      deliveryAddress: address || '',
      pincode: pincode || '',
      locationLink: locationLink || '',
      paymentId: paymentId || '',
      paymentStatus: paymentId ? 'PREPAID' : 'COD / SUBMITTED',
      platform: 'website',
      orderDate: isoDateStr,
      displayDate: dateStr,
      shippingLabelUrl: labelUrl,
      query: query || `Order ID: ${orderId}, Paid: ₹${parsedAmount}`,
      timestamp: timestamp || now.toISOString()
    };

    // 3. Save order permanently in MongoDB
    try {
      const newOrder = new Order(orderData);
      await newOrder.save();
      console.log(`[Order Saved] Order ${orderId} saved to MongoDB.`);
    } catch (dbErr) {
      console.error('Error saving order to MongoDB:', dbErr.message);
    }

    // 4. Send Email Notification with Printable Shipping Label (to admin & customer)
    await sendNotificationEmail(orderData);

    // 5. Append Order to Google Sheet 'sale' tab
    const sheetResult = await appendToGoogleSheet(orderData);

    res.json({
      success: true,
      message: 'Order processed successfully, shipping label generated, and added to sale sheet.',
      orderId,
      productSku: finalSku,
      labelUrl,
      sheetStatus: sheetResult.success ? 'APPENDED' : 'PENDING'
    });

  } catch (error) {
    console.error('Error in checkout-submit:', error);
    res.status(500).json({ success: false, message: 'Server error processing checkout.' });
  }
});

// -----------------------------------------------------------------------------
// Interactive Email Action Handler (Accept / Accept & Generate Label)
// -----------------------------------------------------------------------------
app.get('/api/orders/action', async (req, res) => {
  try {
    await connectDB();
    const { orderId, action } = req.query;

    if (!orderId) {
      return res.status(400).send('<h2>Error: Order ID is required</h2>');
    }

    const host = req.get('host') || 'website-ppur.vercel.app';
    const protocol = req.protocol === 'https' || host.includes('vercel.app') ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;

    let order = await Order.findOne({ orderId });

    if (action === 'accept') {
      if (order) {
        order.paymentStatus = 'ACCEPTED';
        await order.save();
      }
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Order Accepted - ${orderId}</title>
          <style>
            body { font-family: -apple-system, sans-serif; background: #f4f6f8; text-align: center; padding: 50px 20px; color: #111; }
            .card { max-width: 500px; margin: 0 auto; background: #fff; padding: 35px 25px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border-top: 6px solid #2C3E2E; }
            h2 { color: #2C3E2E; margin-top: 0; }
            .badge { display: inline-block; background: #eef5ee; color: #2C3E2E; border: 1.5px solid #2C3E2E; padding: 4px 12px; border-radius: 6px; font-weight: bold; font-size: 16px; margin: 10px 0; }
            .btn { display: inline-block; background: #2C3E2E; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; margin-top: 20px; box-shadow: 0 4px 10px rgba(44,62,46,0.3); }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>✅ Order Accepted!</h2>
            <div class="badge">Order ID: ${orderId}</div>
            <p style="color: #555; line-height: 1.5; font-size: 15px;">
              Order has been marked as <strong>ACCEPTED</strong> in the system.<br>
              Sheet status registered with remark: <code>automated</code>.
            </p>
            <a href="${baseUrl}/api/orders/${orderId}/label" class="btn">🏷️ Generate & Print 4x6 Shipping Label</a>
          </div>
        </body>
        </html>
      `);
    } else if (action === 'accept_label') {
      if (order) {
        order.paymentStatus = 'ACCEPTED_AND_LABELED';
        await order.save();

        // Dispatch shipping label email to Ujjwal ji
        await sendNotificationEmail(order, baseUrl);
      }

      // Redirect immediately to ready-to-print 4x6 shipping label
      return res.redirect(`/api/orders/${orderId}/label`);
    }

    res.status(400).send('Invalid action requested.');
  } catch (err) {
    console.error('Error handling order action:', err);
    res.status(500).send('Server error processing action.');
  }
});

// -----------------------------------------------------------------------------
// Marketplace Sync Endpoint (Flipkart, Meesho, Amazon, Webhook)
// -----------------------------------------------------------------------------
app.post('/api/orders/marketplace-sync', async (req, res) => {
  try {
    await connectDB();
    const {
      platform,
      orderId,
      sku,
      productSku,
      productName,
      quantity,
      amount,
      customerName,
      customerPhone,
      deliveryAddress,
      pincode
    } = req.body;

    const finalPlatform = String(platform || 'marketplace').toLowerCase();
    const finalSku = String(sku || productSku || 'UNKNOWN_SKU').trim();

    // Look up product image and details from MongoDB
    let productDoc = await Product.findOne({
      $or: [
        { sku: finalSku },
        { id: finalSku },
        { name: productName }
      ]
    });

    const imageUrl = productDoc && productDoc.media && productDoc.media.length > 0
      ? productDoc.media[0]
      : 'https://res.cloudinary.com/dgn1wdfdw/image/upload/v1775405892/nyara-luxe-uploads/mphweysnpgmavfe4rlvi.png';

    const now = new Date();
    const todayIso = now.toISOString().split('T')[0];
    const finalOrderId = String(orderId || `${finalPlatform.toUpperCase()}-${Date.now()}`).trim();
    const parsedQty = parseInt(quantity) || 1;
    const parsedAmount = parseFloat(amount) || (productDoc ? productDoc.price : 0) || 0;

    const host = req.get('host') || 'website-ppur.vercel.app';
    const protocol = req.protocol === 'https' || host.includes('vercel.app') ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;
    const labelUrl = `${baseUrl}/api/orders/${finalOrderId}/label`;

    const orderData = {
      orderId: finalOrderId,
      platform: finalPlatform,
      productId: productDoc ? productDoc.id : '',
      productName: productName || (productDoc ? productDoc.name : 'Nyara Luxe Fixture'),
      productSku: finalSku,
      imageUrl: imageUrl,
      quantity: parsedQty,
      amount: parsedAmount,
      customerName: customerName || 'Customer',
      customerPhone: customerPhone || '',
      deliveryAddress: deliveryAddress || '',
      pincode: pincode || '',
      orderDate: todayIso,
      shippingLabelUrl: labelUrl,
      paymentStatus: 'NEW',
      remark: 'automated'
    };

    // 1. Save or update order in MongoDB
    try {
      await Order.findOneAndUpdate({ orderId: finalOrderId }, orderData, { upsert: true, new: true });
      console.log(`[Marketplace Sync] Order ${finalOrderId} saved in MongoDB.`);
    } catch (dbErr) {
      console.error('Order save error in marketplace sync:', dbErr.message);
    }

    // 2. Append to Google Sheet 'sale' tab with 'automated' in Column J (last column)
    const appendResult = await appendToGoogleSheet({
      ...orderData,
      type: 'order',
      remark: 'automated'
    });

    // 3. Send rich email notification with product photo and action buttons
    await sendNotificationEmail(orderData, baseUrl);

    res.json({
      success: true,
      message: `Order ${finalOrderId} synced, inserted into sale sheet as automated, and email dispatched!`,
      orderId: finalOrderId,
      sku: finalSku,
      labelUrl,
      sheetStatus: appendResult.success ? 'APPENDED' : 'PENDING'
    });

  } catch (err) {
    console.error('Error in marketplace-sync:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// Shipping Label Display Endpoint (Print-Ready 4x6 / A4 HTML)
// -----------------------------------------------------------------------------
app.get('/api/orders/:orderId/label', async (req, res) => {
  try {
    await connectDB();
    const { orderId } = req.params;
    let order = await Order.findOne({ orderId });

    if (!order) {
      // Fallback object from query parameters if direct lookup
      order = {
        orderId: orderId,
        customerName: req.query.name || 'Valued Customer',
        customerPhone: req.query.phone || '',
        deliveryAddress: req.query.address || '',
        pincode: req.query.pincode || '',
        productSku: req.query.sku || 'SKU',
        productName: req.query.product || 'Lighting Fixture',
        quantity: parseInt(req.query.qty) || 1,
        amount: parseFloat(req.query.amount) || 0,
        paymentStatus: req.query.paymentStatus || 'PREPAID',
        orderDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      };
    }

    const html = generateShippingLabelHtml(order, false);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    console.error('Error generating label:', err);
    res.status(500).send('Error generating shipping label');
  }
});

// -----------------------------------------------------------------------------
// Orders Listing Endpoint for Admin Panel
// -----------------------------------------------------------------------------
app.get('/api/orders', verifyToken, async (req, res) => {
  try {
    await connectDB();
    const limit = parseInt(req.query.limit) || 50;
    const orders = await Order.find().sort({ createdAt: -1 }).limit(limit);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// -----------------------------------------------------------------------------
// Google Sheet Pending Orders Sync API (Auto-fetched by Sheet on 1-Min Trigger)
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Orders Summary Endpoint (For Google Sheet Popup Dialog & Monitoring)
// -----------------------------------------------------------------------------
app.get('/api/orders-summary', async (req, res) => {
  try {
    await connectDB();
    const todayIso = new Date().toISOString().split('T')[0];
    
    const pendingOrders = await Order.find({
      paymentStatus: { $ne: 'CANCELLED' }
    }).sort({ createdAt: -1 }).limit(30);

    const pendingCount = pendingOrders.filter(o => o.sheetSyncStatus !== 'SYNCED').length;
    const todayCount = pendingOrders.filter(o => o.orderDate === todayIso).length;

    res.json({
      success: true,
      totalOrders: pendingOrders.length,
      pendingSyncCount: pendingCount,
      todayCount: todayCount,
      orders: pendingOrders.map(o => ({
        orderId: o.orderId,
        platform: o.platform || 'website',
        productSku: o.productSku,
        productName: o.productName,
        imageUrl: o.imageUrl,
        quantity: o.quantity || 1,
        amount: o.amount || 0,
        customerName: o.customerName || 'Valued Customer',
        customerPhone: o.customerPhone || '',
        deliveryAddress: o.deliveryAddress || '',
        pincode: o.pincode || '',
        orderDate: o.orderDate,
        paymentStatus: o.paymentStatus,
        sheetSyncStatus: o.sheetSyncStatus,
        shippingLabelUrl: o.shippingLabelUrl || `https://website-ppur.vercel.app/api/orders/${o.orderId}/label`
      }))
    });
  } catch (err) {
    console.error('Error getting orders summary:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// Batch Accept & Send All Shipping Labels to Email
// -----------------------------------------------------------------------------
app.post('/api/batch-accept-labels', async (req, res) => {
  try {
    await connectDB();
    const { orderIds } = req.body;

    let filter = {
      paymentStatus: { $in: ['NEW', 'PAID', 'PENDING', 'ACCEPTED'] }
    };
    if (Array.isArray(orderIds) && orderIds.length > 0) {
      filter = { orderId: { $in: orderIds } };
    }

    const ordersToProcess = await Order.find(filter).sort({ createdAt: -1 }).limit(25);

    if (ordersToProcess.length === 0) {
      return res.json({
        success: true,
        count: 0,
        message: 'No pending orders found to process.'
      });
    }

    // Mark all as ACCEPTED_AND_LABELED
    const ids = ordersToProcess.map(o => o.orderId);
    await Order.updateMany(
      { orderId: { $in: ids } },
      { $set: { paymentStatus: 'ACCEPTED_AND_LABELED' } }
    );

    const baseUrl = 'https://website-ppur.vercel.app';
    const batchHtml = generateBatchOrderEmail(ordersToProcess, baseUrl);

    // Send Consolidated Dispatch Email with all Labels via SMTP
    try {
      const smtpUser = process.env.SMTP_USER || 'info@nyaraluxe.in';
      const smtpPass = process.env.SMTP_PASS || 'NyaraLuxe@978';
      const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com';
      const smtpPort = parseInt(process.env.SMTP_PORT) || 465;

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: true,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      const mailOptions = {
        from: `"Nyara Luxe Fulfillment" <${smtpUser}>`,
        to: 'ujjwaljaini978@gmail.com',
        cc: 'info@nyaraluxe.in',
        subject: `🏷️ [BATCH DISPATCH] ${ordersToProcess.length} Shipping Labels Generated & Ready to Print`,
        html: batchHtml
      };

      await transporter.sendMail(mailOptions);
      console.log(`[Batch Notification] All ${ordersToProcess.length} labels emailed to ujjwaljaini978@gmail.com`);
    } catch (mailErr) {
      console.error('Batch email delivery error:', mailErr.message);
    }

    res.json({
      success: true,
      count: ordersToProcess.length,
      message: `Successfully accepted ${ordersToProcess.length} orders and dispatched all shipping labels to your email!`,
      batchLabelViewUrl: `${baseUrl}/api/batch-labels-view`,
      processedOrderIds: ids
    });
  } catch (err) {
    console.error('Error in batch accept labels:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// Multi-Page Printable Batch Shipping Labels View (Print All in 1-Click)
// -----------------------------------------------------------------------------
app.get('/api/batch-labels-view', async (req, res) => {
  try {
    await connectDB();
    const orders = await Order.find({
      paymentStatus: { $ne: 'CANCELLED' }
    }).sort({ createdAt: -1 }).limit(25);

    const html = generateBatchShippingLabelsHtml(orders, false);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    console.error('Error generating batch labels view:', err);
    res.status(500).send('Error generating batch labels view');
  }
});

// -----------------------------------------------------------------------------
// Pending Returns Sync Endpoint for Google Sheet 'return' Tab
// -----------------------------------------------------------------------------
app.get('/api/pending-returns-sync', async (req, res) => {
  try {
    await connectDB();
    const token = req.query.token;
    if (token !== 'NyaraLuxeSync2026') {
      return res.status(401).json({ error: 'Unauthorized sync token' });
    }
    const returns = await Order.find({
      orderType: 'return',
      sheetSyncStatus: { $ne: 'SYNCED' }
    }).limit(50);
    res.json(returns);
  } catch (err) {
    console.error('Error fetching pending returns:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/mark-returns-synced', async (req, res) => {
  try {
    await connectDB();
    const { token, orderIds } = req.body;
    if (token !== 'NyaraLuxeSync2026') {
      return res.status(401).json({ error: 'Unauthorized sync token' });
    }
    if (Array.isArray(orderIds) && orderIds.length > 0) {
      await Order.updateMany(
        { orderId: { $in: orderIds }, orderType: 'return' },
        { $set: { sheetSyncStatus: 'SYNCED' } }
      );
    }
    res.json({ success: true, count: orderIds ? orderIds.length : 0 });
  } catch (err) {
    console.error('Error marking returns synced:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/pending-orders-sync', async (req, res) => {
  try {
    await connectDB();
    const token = req.query.token;
    if (token !== 'NyaraLuxeSync2026') {
      return res.status(401).json({ error: 'Unauthorized sync token' });
    }
    const pendingOrders = await Order.find({ sheetSyncStatus: { $ne: 'SYNCED' } }).limit(50);
    res.json(pendingOrders);
  } catch (err) {
    console.error('Error fetching pending orders:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/mark-orders-synced', async (req, res) => {
  try {
    await connectDB();
    const { token, orderIds } = req.body;
    if (token !== 'NyaraLuxeSync2026') {
      return res.status(401).json({ error: 'Unauthorized sync token' });
    }
    if (Array.isArray(orderIds) && orderIds.length > 0) {
      await Order.updateMany(
        { orderId: { $in: orderIds } },
        { $set: { sheetSyncStatus: 'SYNCED' } }
      );
    }
    res.json({ success: true, count: orderIds ? orderIds.length : 0 });
  } catch (err) {
    console.error('Error marking orders synced:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/:orderId', async (req, res) => {
  try {
    await connectDB();
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order' });
  }
});

// Help form submission
app.post('/api/help-request', async (req, res) => {
  try {
    const { productId, productName, productSku, name, email, query, timestamp } = req.body;

    if (!name || (!email && !req.body.phone) || !query) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing.'
      });
    }

    const requestData = {
      productName,
      productSku,
      name,
      email,
      phone: req.body.phone || '',
      address: req.body.address || '',
      pincode: req.body.pincode || '',
      locationLink: req.body.locationLink || '',
      query,
      timestamp: timestamp || new Date().toISOString()
    };

    // Send email notification to info@nyaraluxe.in
    await sendNotificationEmail(requestData);

    const result = await appendToGoogleSheet(requestData);
    res.json(result);
  } catch (error) {
    console.error('Error processing help request:', error);
    res.status(500).json({
      success: false,
      message: 'Sorry, there was an error submitting your query.'
    });
  }
});

// Chatbot Live User Online Ping Endpoint
app.post('/api/chat-online', async (req, res) => {
  try {
    await connectDB();
    let { sessionId, pageUrl, timestamp } = req.body;
    
    if (!sessionId) {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }

    const nowTime = Date.now();
    const timeStr = timestamp || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    let session = await ChatSession.findOne({ sessionId });
    if (!session) {
      session = new ChatSession({
        sessionId,
        customerName: 'Active Customer',
        customerContact: 'Not provided',
        pageUrl: pageUrl || 'Home Page',
        lastActiveTime: nowTime,
        messages: []
      });
    } else {
      session.lastActiveTime = nowTime;
      if (pageUrl) session.pageUrl = pageUrl;
    }
    await session.save();

    // Online status updated in MongoDB (No email or sheet ping sent for online status)
    res.json({ success: true, sessionId, message: 'Online status updated.' });
  } catch (error) {
    console.error('Error in chat-online alert:', error);
    res.status(500).json({ success: false, message: 'Alert processing error' });
  }
});

// Chatbot Query Logger Endpoint
app.post('/api/chat-query', async (req, res) => {
  try {
    await connectDB();
    const { sessionId, category, name, contact, query, pageUrl, timestamp } = req.body;

    const timeStr = timestamp || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const nowTime = Date.now();

    const sid = sessionId || ('sess_' + Date.now());
    let session = await ChatSession.findOne({ sessionId: sid });
    if (!session) {
      session = new ChatSession({
        sessionId: sid,
        customerName: name || 'Website Visitor',
        customerContact: contact || 'Not provided',
        pageUrl: pageUrl || 'Home Page',
        lastActiveTime: nowTime,
        messages: []
      });
    }

    if (name) session.customerName = name;
    if (contact) session.customerContact = contact;
    if (pageUrl) session.pageUrl = pageUrl;
    session.lastActiveTime = nowTime;

    if (query) {
      session.messages.push({
        id: Date.now(),
        sender: 'customer',
        category: category || 'General',
        text: query,
        timestamp: timeStr,
        isRead: false
      });
    }

    await session.save();

    const chatQueryData = {
      type: 'chat_query',
      sheetName: 'Customer Queries',
      category: category || 'General Query',
      name: name || session.customerName,
      phone: contact || session.customerContact,
      email: contact || session.customerContact,
      query: `[Category: ${category || 'Query'}] ${query || ''}`,
      rawQuery: query || '',
      pageUrl: pageUrl || '',
      timestamp: timeStr
    };

    // 1. Send Email Notification to info@nyaraluxe.in
    sendNotificationEmail({
      productName: `Chat Query (${category || 'General'})`,
      name: name || session.customerName,
      phone: contact || session.customerContact,
      email: contact || session.customerContact,
      query: `Category: ${category || 'Query'}\nMessage: ${query || ''}`,
      timestamp: timeStr
    }).catch(e => console.log('Mail error:', e));

    // 2. Forward to Webhook
    await appendToGoogleSheet(chatQueryData);
    res.json({ success: true, sessionId: sid });
  } catch (error) {
    console.error('Error in chat-query logger:', error);
    res.status(500).json({ success: false, message: 'Chat query logging error' });
  }
});

// Customer Poll for Messages Endpoint
app.get('/api/chat-messages', async (req, res) => {
  try {
    await connectDB();
    const { sessionId } = req.query;
    if (!sessionId) {
      return res.json({ success: true, messages: [] });
    }

    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return res.json({ success: true, messages: [] });
    }

    session.lastActiveTime = Date.now();
    await session.save();

    res.json({ success: true, messages: session.messages || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

// Admin List Live Chat Sessions Endpoint
app.get('/api/admin/chat-sessions', verifyToken, async (req, res) => {
  try {
    await connectDB();
    const now = Date.now();
    const dbSessions = await ChatSession.find().sort({ lastActiveTime: -1 }).limit(50);

    const sessionsList = dbSessions.map(s => {
      const isOnline = (now - (s.lastActiveTime || 0)) < 120000; // active in last 2 minutes
      const unreadCount = (s.messages || []).filter(m => m.sender === 'customer' && !m.isRead).length;
      const lastMsg = (s.messages && s.messages.length > 0) ? s.messages[s.messages.length - 1] : null;

      return {
        sessionId: s.sessionId,
        customerName: s.customerName || 'Customer',
        customerContact: s.customerContact || 'Not provided',
        pageUrl: s.pageUrl || 'Home',
        isOnline: isOnline,
        unreadCount: unreadCount,
        lastMessage: lastMsg ? lastMsg.text : 'No messages yet',
        lastMessageTime: lastMsg ? lastMsg.timestamp : (s.createdAt ? s.createdAt.toLocaleString() : ''),
        totalMessages: (s.messages || []).length
      };
    });

    res.json({ success: true, sessions: sessionsList });
  } catch (error) {
    console.error('Error fetching admin sessions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin sessions' });
  }
});

// Admin Fetch Single Session Messages Endpoint
app.get('/api/admin/chat-messages/:sessionId', verifyToken, async (req, res) => {
  try {
    await connectDB();
    const { sessionId } = req.params;
    const session = await ChatSession.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    let updated = false;
    (session.messages || []).forEach(m => {
      if (m.sender === 'customer' && !m.isRead) {
        m.isRead = true;
        updated = true;
      }
    });

    if (updated) {
      await session.save();
    }

    res.json({
      success: true,
      session: session,
      messages: session.messages || []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch thread' });
  }
});

// Admin Send Reply to Customer Endpoint
app.post('/api/admin/chat-reply', verifyToken, async (req, res) => {
  try {
    await connectDB();
    const { sessionId, text } = req.body;
    if (!sessionId || !text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Session ID and text required' });
    }

    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Customer session not found' });
    }

    const replyMsg = {
      id: Date.now(),
      sender: 'admin',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    session.messages.push(replyMsg);
    session.lastActiveTime = Date.now();
    await session.save();

    res.json({ success: true, message: replyMsg });
  } catch (error) {
    console.error('Error in admin chat-reply:', error);
    res.status(500).json({ success: false, message: 'Failed to send reply' });
  }
});


// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || "Something went wrong!", details: err.toString() });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);

  // Initialize admin and categories if connected to DB
  if (MONGODB_URI) {
    await initializeAdmin();
    await initializeCategories();
  }
});
