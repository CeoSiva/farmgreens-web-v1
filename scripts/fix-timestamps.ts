import mongoose from 'mongoose';

// Minimal script to resolve "TypeError: Cannot read properties of undefined (reading 'toISOString')"
// by assigning default timestamps to products missing them.

async function fixProducts() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not defined in environment!');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected.');

    // We use a raw collection update to bypass schema validation issues in scratch scripts
    const collection = mongoose.connection.db?.collection('products');
    if (!collection) throw new Error('Products collection not found');

    const result = await collection.updateMany(
      { createdAt: { $exists: false } },
      { $set: { createdAt: new Date(), updatedAt: new Date() } }
    );

    console.log(`Successfully fixed ${result.modifiedCount} products with missing timestamps.`);
  } catch (err) {
    console.error('Failed to fix products:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixProducts();
