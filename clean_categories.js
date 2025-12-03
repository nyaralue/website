const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGO_URL || 'mongodb://localhost:27017/nyara-luxe';

const categorySchema = new mongoose.Schema({
    name: String,
    displayName: String,
    icon: String,
    createdAt: Date
});

const Category = mongoose.model('Category', categorySchema);

async function cleanCategories() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Delete ALL categories first
        await Category.deleteMany({});
        console.log('🗑️  Cleared all categories');

        // Add only the correct categories
        const correctCategories = [
            { name: 'chandelier', displayName: 'Chandelier', icon: 'fa-lightbulb' },
            { name: 'lights', displayName: 'Lights & Lamps', icon: 'fa-lightbulb' },
            { name: 'decors', displayName: 'Decors Showpieces', icon: 'fa-gem' },
            { name: 'functional', displayName: 'Functional Mini Decor', icon: 'fa-box-open' }
        ];

        for (const cat of correctCategories) {
            await Category.create({
                ...cat,
                createdAt: new Date()
            });
            console.log(`✅ Added: ${cat.name} → ${cat.displayName}`);
        }

        console.log('\n✅ Final categories:');
        const final = await Category.find({});
        final.forEach(c => {
            console.log(`   - ${c.name} → ${c.displayName} (${c.icon})`);
        });

        await mongoose.disconnect();
        console.log('\n🎉 Categories cleaned successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

cleanCategories();
