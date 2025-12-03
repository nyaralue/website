const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGO_URL || 'mongodb://localhost:27017/nyara-luxe';

const categorySchema = new mongoose.Schema({
    name: String,
    displayName: String,
    icon: String,
    createdAt: Date
});

const Category = mongoose.model('Category', categorySchema);

async function fixCategories() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check existing categories
        const existing = await Category.find({});
        console.log('Existing categories:', existing.map(c => c.name));

        // Categories that need to exist based on products
        const requiredCategories = [
            { name: 'chandelier', displayName: 'Chandelier', icon: 'fa-chandelier' },
            { name: 'lights', displayName: 'Lights & Lamps', icon: 'fa-lightbulb' },
            { name: 'decors', displayName: 'Decors Showpieces', icon: 'fa-gem' },
            { name: 'functional', displayName: 'Functional Mini Decor', icon: 'fa-box-open' }
        ];

        for (const cat of requiredCategories) {
            const exists = await Category.findOne({ name: cat.name });
            if (!exists) {
                await Category.create({
                    ...cat,
                    createdAt: new Date()
                });
                console.log(`✅ Added category: ${cat.name}`);
            } else {
                console.log(`ℹ️  Category already exists: ${cat.name}`);
            }
        }

        // Remove unused categories
        const unusedCategories = ['light', 'jhoomar'];
        for (const catName of unusedCategories) {
            const result = await Category.deleteMany({ name: catName });
            if (result.deletedCount > 0) {
                console.log(`🗑️  Removed unused category: ${catName}`);
            }
        }

        console.log('\n✅ Final categories:');
        const final = await Category.find({});
        final.forEach(c => {
            console.log(`   - ${c.name} → ${c.displayName} (${c.icon})`);
        });

        await mongoose.disconnect();
        console.log('\n🎉 Categories fixed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixCategories();
