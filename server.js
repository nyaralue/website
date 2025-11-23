const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'nyara-luxe-secret-key-change-in-production';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'public', 'uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Only images and videos are allowed.'));
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Data files
const PRODUCTS_FILE = path.join(__dirname, 'data', 'products.json');
const ADMIN_FILE = path.join(__dirname, 'data', 'admin.json');

// Google Sheets configuration
const GOOGLE_SHEET_ID = '1R6McSZtFDe0vlt647WCoaLP4KKKyIpgDrbfwhDF_yGs';
const GOOGLE_SHEET_RANGE = 'Sheet1'; // Change this to your sheet name if different

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
      // If authentication failed, save to local file as fallback
      console.log('Google Sheets authentication failed, saving to local file');
      return await saveToLocalFile(data);
    }
    
    // Format data for Google Sheets (remove product ID)
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
    
    // Append to Google Sheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: GOOGLE_SHEET_RANGE,
      valueInputOption: 'RAW',
      resource: {
        values: values
      }
    });
    
    return { success: true, message: 'Your query has been submitted successfully. We will contact you shortly.' };
    
  } catch (error) {
    console.error('Error appending to Google Sheet:', error);
    // Fallback to local file storage
    return await saveToLocalFile(data);
  }
}

// Fallback function to save to local file
async function saveToLocalFile(data) {
  try {
    const helpRequestsFile = path.join(__dirname, 'data', 'help_requests.json');
    
    // Ensure data directory exists
    try {
      await fs.access(path.join(__dirname, 'data'));
    } catch {
      await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    }
    
    // Read existing requests
    let requests = [];
    try {
      const fileData = await fs.readFile(helpRequestsFile, 'utf8');
      requests = JSON.parse(fileData);
    } catch (error) {
      // File doesn't exist or is invalid, start with empty array
      requests = [];
    }
    
    // Add new request
    const newRequest = {
      id: Date.now().toString(),
      ...data
    };
    
    requests.push(newRequest);
    
    // Save updated requests
    await fs.writeFile(helpRequestsFile, JSON.stringify(requests, null, 2));
    
    return { success: true, message: 'Your query has been submitted successfully. We will contact you shortly.' };
  } catch (error) {
    console.error('Error saving to local file:', error);
    return { success: false, message: 'Sorry, there was an error submitting your query. Please try again.' };
  }
}

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.join(__dirname, 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Initialize data files
async function initializeData() {
  await ensureDataDir();
  
  // Initialize products file
  try {
    await fs.access(PRODUCTS_FILE);
  } catch {
    const defaultProducts = {
      categories: {
        light: [],
        decors: [],
        functional: []
      }
    };
    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(defaultProducts, null, 2));
  }
  
  // Initialize admin file
  try {
    await fs.access(ADMIN_FILE);
  } catch {
    const hashedPassword = await bcrypt.hash('Bawalibuch@123', 10);
    const adminData = {
      username: 'UjjwalSinghi978',
      password: hashedPassword
    };
    await fs.writeFile(ADMIN_FILE, JSON.stringify(adminData, null, 2));
  }
}

// Read products
async function readProducts() {
  try {
    const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { categories: {} };
  }
}

// Write products
async function writeProducts(products) {
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2));
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
    const { username, password } = req.body;
    const adminData = JSON.parse(await fs.readFile(ADMIN_FILE, 'utf8'));
    
    if (username !== adminData.username) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValid = await bcrypt.compare(password, adminData.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ username: adminData.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await readProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get products by category
app.get('/api/products/:category', async (req, res) => {
  try {
    const products = await readProducts();
    const category = req.params.category;
    res.json(products.categories[category] || []);
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
    
    const fileUrls = req.files.map(file => `/uploads/${file.filename}`);
    res.json({ urls: fileUrls, message: 'Files uploaded successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Add product (Admin only)
app.post('/api/products', verifyToken, async (req, res) => {
  try {
    const { category, product } = req.body;
    const products = await readProducts();
    
    if (!products.categories[category]) {
      products.categories[category] = [];
    }
    
    product.id = Date.now().toString();
    product.createdAt = new Date().toISOString();
    products.categories[category].push(product);
    
    await writeProducts(products);
    res.json({ message: 'Product added successfully', product });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// Update product (Admin only)
app.put('/api/products/:category/:id', verifyToken, async (req, res) => {
  try {
    const { category, id } = req.params;
    const updatedProduct = req.body;
    const products = await readProducts();
    
    if (!products.categories[category]) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    const index = products.categories[category].findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    products.categories[category][index] = { ...products.categories[category][index], ...updatedProduct };
    await writeProducts(products);
    res.json({ message: 'Product updated successfully', product: products.categories[category][index] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product (Admin only)
app.delete('/api/products/:category/:id', verifyToken, async (req, res) => {
  try {
    const { category, id } = req.params;
    const products = await readProducts();
    
    if (!products.categories[category]) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    products.categories[category] = products.categories[category].filter(p => p.id !== id);
    await writeProducts(products);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Get categories
app.get('/api/categories', async (req, res) => {
  try {
    const products = await readProducts();
    res.json(Object.keys(products.categories));
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

// Add a new route to handle help form submissions
app.post('/api/help-request', async (req, res) => {
  try {
    const { productId, productName, productSku, name, email, query, timestamp } = req.body;
    
    // Validate required fields
    if (!name || !email || !query) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and query are required fields.' 
      });
    }
    
    // Prepare data for storage (only use SKU, not product ID)
    const requestData = {
      productName,
      productSku,
      name,
      email,
      query,
      timestamp: timestamp || new Date().toISOString()
    };
    
    // Save to Google Sheet (or fallback to local file)
    const result = await appendToGoogleSheet(requestData);
    
    res.json(result);
  } catch (error) {
    console.error('Error processing help request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sorry, there was an error submitting your query. Please try again.' 
    });
  }
});

// Initialize and start server
initializeData().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin`);
  });
});

