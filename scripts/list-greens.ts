import mongoose from 'mongoose';

// Script to list current greens from the database
const ProductSchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
}, { strict: false });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function listGreens() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not defined');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    const greens = await Product.find({ category: 'greens' }).lean();
    console.log('LIST_START');
    greens.forEach(g => console.log(`- ${g.name} (Price: ${g.price})`));
    console.log('LIST_END');
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

listGreens();
