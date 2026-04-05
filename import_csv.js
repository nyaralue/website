require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');
const csv = require('csv-parser');
const path = require('path');

const Product = require('./models/Product');
const Category = require('./models/Category');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://info_db_user:DtBE84LlLUD6yaEg@free.ltju6fx.mongodb.net/?appName=Free';
const CSV_FILE_PATH = '/Users/Nikhil/Downloads/Pending catalog - website upload.csv';

async function importCSV() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB.');

        // Delete all exiting products
        console.log('Deleting all existing products...');
        const deleteResult = await Product.deleteMany({});
        console.log(`Deleted ${deleteResult.deletedCount} existing products.`);

        const productsToInsert = [];
        const uniqueCategories = new Set();
        
        console.log('Reading CSV file from: ', CSV_FILE_PATH);
        
        // Return a promise wrapped stream reader
        await new Promise((resolve, reject) => {
            fs.createReadStream(CSV_FILE_PATH)
                .pipe(csv({
                    mapHeaders: ({ header, index }) => header.trim()
                }))
                .on('data', (row) => {
                    // Check if row has enough data to be a product
                    if (!row['Name'] || !row['Product ID']) return;

                    const priceStr = row['selling price'] ? row['selling price'].replace(/,/g, '') : '0';
                    const catName = row['Category'] ? row['Category'].trim() : 'uncategorized';
                    const catId = catName.toLowerCase().replace(/\s+/g, '-');
                    
                    uniqueCategories.add(JSON.stringify({ name: catId, displayName: catName }));

                    const product = {
                        id: row['varient ID'] || row['Product ID'] || Date.now().toString(),
                        category: catId,
                        name: row['Name'],
                        price: parseFloat(priceStr) || 0,
                        description: row['Description'] || '',
                        sku: row['varient ID'] || row['Product ID'] || '',
                        amazonLink: row['Amazon link'] || '',
                        flipkartLink: row['Flipkart link'] || '',
                        meeshoLink: row['Meesho link new'] || '',
                        media: [] // Images will be handled out of band or empty for now
                    };
                    
                    productsToInsert.push(product);
                })
                .on('end', () => resolve())
                .on('error', (err) => reject(err));
        });

        console.log(`Parsed ${productsToInsert.length} products from CSV.`);
        
        // Ensure Categories exist
        for (const catStr of uniqueCategories) {
            const cat = JSON.parse(catStr);
            const existingCat = await Category.findOne({ name: cat.name });
            if (!existingCat) {
                console.log(`Creating new category: ${cat.name}`);
                await Category.create({
                    name: cat.name,
                    displayName: cat.displayName,
                    icon: 'fa-box'
                });
            }
        }
        
        // Insert products in bulk
        if (productsToInsert.length > 0) {
            console.log('Inserting products into DB...');
            // We use simple iteration to gracefully handle duplicates or insertion issues if any
            let inserted = 0;
            let errors = 0;
            for (const p of productsToInsert) {
                try {
                    await Product.create(p);
                    inserted++;
                } catch (err) {
                    if (err.code === 11000) {
                        // Duplicate ID, append something and retry or just log
                        console.warn(`Duplicate ID error for Product ID ${p.id}, appending timestamp`);
                        p.id = `${p.id}_${Date.now()}`;
                        try {
                            await Product.create(p);
                            inserted++;
                        } catch (err2) {
                            errors++;
                        }
                    } else {
                        console.error('Error inserting product:', p.id, err.message);
                        errors++;
                    }
                }
            }
            console.log(`Successfully inserted ${inserted} products. Encounters ${errors} errors.`);
        } else {
            console.log('No valid products found to insert.');
        }

    } catch (err) {
        console.error('An error occurred during import:', err);
    } finally {
        mongoose.connection.close();
        console.log('MongoDB connection closed.');
    }
}

importCSV();
