# Nyara Luxe - Interior Design Shopping Website

A modern, elegant shopping website for interior design items with a comprehensive admin panel.

## Features

- 🛍️ Beautiful product catalog with category filtering
- 🔐 Secure admin panel with login authentication
- ✏️ Easy product management (Add, Edit, Delete)
- 📱 Responsive design for all devices
- 🎨 Brand-consistent design with Nyara Luxe colors and fonts
- 🔗 Tally form integration for Buy Now buttons

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   ```
   For development with auto-reload:
   ```bash
   npm run dev
   ```

3. **Access the Website**
   - Homepage: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin

4. **Default Admin Credentials**
   - Username: `admin`
   - Password: `admin123`
   
   ⚠️ **Important**: Change the default password in production!

## Admin Panel Features

- **Category Management**: Select different categories (Light & Lamps, Decors Showpieces, Functional Mini Decor) from dropdown
- **Add Products**: Click "Add New Product" to add items
- **Edit Products**: Click "Edit" on any product card
- **Delete Products**: Click "Delete" to remove products
- **Tally Form Links**: Add Tally form URLs to products - when customers click "Buy Now", they'll be redirected to your form

## Product Fields

- **Name** (Required): Product name
- **Description**: Product description
- **Price**: Product price in ₹
- **Image URL**: Link to product image
- **Tally Form Link**: Link to your Tally form for orders

## Brand Colors

- Deep Olive Green: `#464C3C`
- Muted Moss Grey-Green: `#757D70`
- Soft Stone Beige: `#D0CBC1`
- Warm Off-White: `#E3E1DE`
- Taupe Sand: `#AEA385`

## Brand Fonts

- Headings: Cormorant Garamond
- Body: Lato

## File Structure

```
nyara-luxe/
├── server.js          # Express server and API
├── package.json        # Dependencies
├── data/              # JSON data files (auto-created)
│   ├── products.json  # Product data
│   └── admin.json     # Admin credentials
└── public/            # Frontend files
   ├── index.html     # Homepage
   ├── admin.html     # Admin panel
   ├── styles.css     # Homepage styles
   ├── admin.css      # Admin panel styles
   ├── script.js      # Homepage JavaScript
   └── admin.js       # Admin panel JavaScript
```

## Adding Tally Form Links

1. Log in to the admin panel
2. Edit any product
3. Paste your Tally form URL in the "Tally Form Link" field
4. Save the product
5. When customers click "Buy Now", they'll be redirected to your form

## Notes

- Product data is stored in `data/products.json`
- Admin credentials are stored in `data/admin.json`
- The server runs on port 3000 by default
- All changes are saved immediately

## Production Deployment

Before deploying:
1. Change the default admin password
2. Update `JWT_SECRET` in `server.js` to a secure random string
3. Consider using a proper database instead of JSON files
4. Set up HTTPS for secure connections