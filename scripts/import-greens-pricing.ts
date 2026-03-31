import mongoose from 'mongoose';

console.log('Starting Chennai Greens Pricing Automation Script...');

// Define models locally to avoid alias issues in scratch scripts
const DistrictSchema = new mongoose.Schema({
  name: { type: String, required: true },
});
const DistrictModel = mongoose.models.District || mongoose.model('District', DistrictSchema);

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  orderQuantity: { type: Object, required: true },
  customPricing: [{ districtId: { type: mongoose.Schema.Types.ObjectId, ref: 'District' }, price: Number }],
  status: { type: String, default: 'active' },
  showOnHomePage: { type: Boolean, default: true },
}, { timestamps: true });
const ProductModel = mongoose.models.Product || mongoose.model('Product', ProductSchema);

const greensData = [
  { name: 'Arai Keerai', price: 35 },
  { name: 'Siru Keerai', price: 35 },
  { name: 'Mola Keerai', price: 40 },
  { name: 'Palak Keerai', price: 40 },
  { name: 'Manathakkali Keerai', price: 40 },
  { name: 'Pulicha Keerai', price: 40 },
  { name: 'Murungai Keerai', price: 50 },
  { name: 'Ponnanganni Keerai', price: 40 },
  { name: 'Red Ponnanganni', price: 40 },
  { name: 'Vendhaya Keerai (Big)', price: 50 },
  { name: 'Vendhaya Keerai (Small)', price: 50 },
  { name: 'Paruppu Keerai', price: 40 },
  { name: 'Thudhuvalai', price: 35 },
  { name: 'Vallarai', price: 35 },
  { name: 'Modakathan', price: 35 },
  { name: 'Vengayathaal (Spring Onion)', price: 35 },
  { name: 'Mullangi Keerai', price: 45 },
  { name: 'Agathi Keerai', price: 42 },
  { name: 'Thandu Keerai (Red)', price: 45 },
  { name: 'Kothamalli', price: 20 },
  { name: 'Pudhina', price: 15 },
  { name: 'Pirandai', price: 50 },
  { name: 'Manjal Karisalanganni', price: 65 },
  { name: 'Vellai Karisalanganni', price: 65 },
  { name: 'Marudhani', price: 50 },
  { name: 'Sukka Keerai', price: 45 },
  { name: 'Kadugu Keerai', price: 50 },
  { name: 'Shozhiya Keerai', price: 50 },
  { name: 'Kaasini Keerai', price: 50 },
  { name: 'Vasalai Keerai', price: 30 },
  { name: 'Mookaratan Keerai', price: 60 },
  { name: 'Thuthi Keerai', price: 50 },
  { name: 'Pasalai Keerai', price: 60 },
  { name: 'Curry Leaf', price: 20 },
  { name: 'Keelanelli', price: 60 },
  { name: 'Kuppameni Keerai', price: 50 },
  { name: 'Mosu Mosu Keerai', price: 55 },
  { name: 'Tharai Pasalai', price: 50 },
  { name: 'Chakaravarthi', price: 50 },
  { name: 'Sombu Keerai', price: 50 },
  { name: 'Papaya Leaf', price: 50 },
  { name: 'Vathanarayanan', price: 60 },
  { name: 'Kalayana Murungai', price: 60 },
  { name: 'Nayuruvi', price: 50 },
];

async function run() {
  try {
    const uri = process.env.MONGODB_URI;
    console.log(`Using MONGODB_URI: ${uri ? uri.substring(0, 20) + '...' : 'UNDEFINED'}`);
    if (!uri) throw new Error('MONGODB_URI is not defined in environment properties');

    console.log('Attempting to connect to MongoDB with 10s timeout...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('Connected to MongoDB successfully!');

    // Find Chennai district
    console.log('Searching for Chennai district...');
    const district = await DistrictModel.findOne({ name: { $regex: /^chennai$/i } });
    if (!district) {
      console.error('CRITICAL ERROR: Chennai district not found in the "District" collection!');
      process.exit(1);
    }
    const districtId = district._id;
    console.log(`Found Chennai District ID: ${districtId}`);

    // Retroactive fix for products missing timestamps
    const fixRes = await ProductModel.updateMany(
      { createdAt: { $exists: false } },
      { $set: { createdAt: new Date(), updatedAt: new Date() } }
    );
    if (fixRes.modifiedCount > 0) {
      console.log(`[HOTFIX] Assigned timestamps to ${fixRes.modifiedCount} previously broken Products!`);
    }

    let updatedCount = 0;
    let createdCount = 0;

    for (const item of greensData) {
      const existingProduct = await ProductModel.findOne({
        name: { $regex: new RegExp(`^${item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      });

      if (existingProduct) {
        // Update existing product's customPricing
        const pricingArray = existingProduct.customPricing || [];
        const existingPricingIndex = pricingArray.findIndex(
          (p: any) => p.districtId && p.districtId.toString() === districtId.toString()
        );

        if (existingPricingIndex >= 0) {
          pricingArray[existingPricingIndex].price = item.price;
        } else {
          pricingArray.push({ districtId, price: item.price });
        }

        existingProduct.customPricing = pricingArray;
        // Make sure it's in greens category just to be safe
        if (!existingProduct.category) existingProduct.category = 'greens';
        await existingProduct.save();
        updatedCount++;
        console.log(`[UPDATED] ${item.name} -> Chennai Price: ${item.price}`);
      } else {
        // Create new green
        await ProductModel.create({
          name: item.name,
          category: 'greens',
          price: item.price, // Base fallback price
          orderQuantity: { type: 'count', unit: 'bunch' },
          customPricing: [{ districtId, price: item.price }],
          status: 'active',
          showOnHomePage: true,
        });
        createdCount++;
        console.log(`[CREATED] ${item.name} -> Base/Chennai Price: ${item.price}`);
      }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Total Greens Processed: ${greensData.length}`);
    console.log(`Products Updated: ${updatedCount}`);
    console.log(`Products Created: ${createdCount}`);
    console.log(`===============\n`);

  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

run();
