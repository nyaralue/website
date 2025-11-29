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

// Import Models
const Product = require('./models/Product');
const Admin = require('./models/Admin');
const HelpRequest = require('./models/HelpRequest');

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

// Function to append data to Google Sheet
async function appendToGoogleSheet(data) {
  try {
    const sheets = await getGoogleSheetsClient();

    if (!sheets) {
      console.log('Google Sheets authentication failed, saving to MongoDB');
      return await saveToMongoDB(data);
    }

    const values = [
      [
        data.id || '',
        data.productName || '',
        data.productSku || '',
        data.name || '',
        data.email || '',
        data.query || '',
        data.timestamp || new Date().toISOString()
      ]
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: GOOGLE_SHEET_RANGE,
      valueInputOption: 'RAW',
      resource: { values: values }
    });

    // Also save to MongoDB for redundancy
    await saveToMongoDB(data);

    return { success: true, message: 'Your query has been submitted successfully.' };

  } catch (error) {
    console.error('Error appending to Google Sheet:', error);
    return await saveToMongoDB(data);
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
    const products = await Product.find();
    console.log(`Found ${products.length} products`);

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
    const products = await Product.find({ category });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
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

    const product = await Product.findOneAndUpdate({ id: id }, updatedData, { new: true });

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
    const result = await Product.findOneAndDelete({ id: id });

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
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
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

// Help form submission
app.post('/api/help-request', async (req, res) => {
  try {
    const { productId, productName, productSku, name, email, query, timestamp } = req.body;

    if (!name || !email || !query) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and query are required fields.'
      });
    }

    const requestData = {
      productName,
      productSku,
      name,
      email,
      query,
      timestamp: timestamp || new Date().toISOString()
    };

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

  // Initialize admin if connected to DB
  if (MONGODB_URI) {
    await initializeAdmin();
  }
});
