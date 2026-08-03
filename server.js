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

// Google Sheets configuration
const GOOGLE_SHEET_ID = '1R6McSZtFDe0vlt647WCoaLP4KKKyIpgDrbfwhDF_yGs';
const GOOGLE_SHEET_RANGE = 'Sheet1';

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

// Function to append data to Google Sheet (ONLY Google Sheet, no MongoDB)
async function appendToGoogleSheet(data) {
  try {
    const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbx9J7Rl-rWjkz6t77IZgMsw2O3TWKhJeX0gaZcOr2BPsZ81j_f1JBszRzde4mkeCrkdfw/exec';
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        console.log('Successfully sent order data to Google Sheet Webhook');
      } catch (err) {
        console.error('Error posting to Google Sheet Webhook:', err.message);
      }
    }

    const sheets = await getGoogleSheetsClient();

    if (sheets) {
      const values = [
        [
          new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          data.productName || '',
          data.name || '',
          data.phone || '',
          data.address || '',
          data.pincode || '',
          data.email || '',
          data.locationLink || '',
          data.query || ''
        ]
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: GOOGLE_SHEET_RANGE,
        valueInputOption: 'RAW',
        resource: { values: values }
      });
    }

    return { success: true, message: 'Your order has been submitted to Google Sheet successfully.' };

  } catch (error) {
    console.error('Error appending to Google Sheet:', error);
    return { success: false, message: 'Error processing Google Sheet submission.' };
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

// Function to send email notification for orders and inquiries to info@nyaraluxe.in (Triggering Vercel Redeploy)
async function sendNotificationEmail(orderData) {
  try {
    const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '465');
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER || 'info@nyaraluxe.in';
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

    if (!smtpUser || !smtpPass) {
      console.log('[Hostinger SMTP Notification Log] Form submitted for info@nyaraluxe.in:', JSON.stringify(orderData, null, 2));
      return;
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: true, // SSL for port 465 (Hostinger standard)
      auth: { user: smtpUser, pass: smtpPass }
    });

    const mailOptions = {
      from: `"Nyara Luxe Orders" <${smtpUser}>`,
      to: 'info@nyaraluxe.in',
      subject: `🛒 New Nyara Luxe Order / Form: ${orderData.productName || 'Customer Submission'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #2C3E2E; border-radius: 10px; background: #F8F9F8;">
          <h2 style="color: #2C3E2E; border-bottom: 2px solid #D4AF37; padding-bottom: 8px;">🛍️ New Order / Submission Received</h2>
          
          <p style="font-size: 1.05rem;"><strong>Product Name:</strong> ${orderData.productName || 'N/A'}</p>
          
          <div style="background: #FFF; padding: 15px; border-radius: 8px; border: 1px solid #DDD; margin: 15px 0;">
            <h3 style="color: #2C3E2E; margin-top: 0;">👤 Customer Information:</h3>
            <p><strong>Full Name:</strong> ${orderData.name || 'N/A'}</p>
            <p><strong>Mobile Number:</strong> <a href="tel:${orderData.phone}">${orderData.phone || 'N/A'}</a></p>
            <p><strong>Email Address:</strong> ${orderData.email || 'Not provided'}</p>
            <p><strong>Delivery Address:</strong> ${orderData.address || 'N/A'}</p>
            <p><strong>Pincode:</strong> ${orderData.pincode || 'N/A'}</p>
            <p><strong>Location Link:</strong> ${orderData.locationLink ? `<a href="${orderData.locationLink}" target="_blank">${orderData.locationLink}</a>` : 'Not provided'}</p>
          </div>

          <div style="background: #FFF; padding: 15px; border-radius: 8px; border: 1px solid #DDD;">
            <h3 style="color: #2C3E2E; margin-top: 0;">💳 Payment & Order Details:</h3>
            <p><strong>Status / Details:</strong> ${orderData.query || 'Order Form Submitted'}</p>
            <p><strong>Timestamp:</strong> ${orderData.timestamp || new Date().toLocaleString()}</p>
          </div>

          <p style="font-size: 0.8rem; color: #777; margin-top: 20px; text-align: center;">Nyara Luxe Automated Notification System</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Successfully sent order email notification to info@nyaraluxe.in');
  } catch (err) {
    console.error('Failed to send notification email:', err.message);
  }
}

// Dedicated Checkout Form Submission Endpoint
app.post('/api/checkout-submit', async (req, res) => {
  try {
    const { productName, productSku, name, phone, address, pincode, email, locationLink, query, timestamp } = req.body;

    const requestData = {
      productName: productName || 'Nyara Luxe Product',
      productSku: productSku || 'N/A',
      name: name || 'Customer',
      phone: phone || '',
      email: email || '',
      address: address || '',
      pincode: pincode || '',
      locationLink: locationLink || '',
      query: query || `Name: ${name}, Phone: ${phone}, Address: ${address}, Pincode: ${pincode}, Location: ${locationLink || 'N/A'}`,
      timestamp: timestamp || new Date().toISOString()
    };

    // 1. Send Email Notification to info@nyaraluxe.in
    await sendNotificationEmail(requestData);

    // 2. Append to Google Sheet & Save to MongoDB
    const result = await appendToGoogleSheet(requestData);
    res.json(result);
  } catch (error) {
    console.error('Error in checkout-submit:', error);
    res.status(500).json({ success: false, message: 'Server error processing checkout.' });
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
