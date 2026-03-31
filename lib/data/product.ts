import { connectDB } from "../db";
import ProductModel, { IProduct } from "../models/product";
import DistrictModel from "../models/district";

// Helper function to resolve the correct price for a product based on the district
async function applyDistrictPricing(products: IProduct[], districtSlug?: string): Promise<IProduct[]> {
  if (!districtSlug || products.length === 0) return products;

  const district = await DistrictModel.findOne({ name: { $regex: new RegExp(`^${districtSlug}$`, 'i') } }).lean();
  if (!district) return products;

  return products.map(product => {
    const custom = product.customPricing?.find((cp: any) => cp.districtId.toString() === district._id.toString());
    if (custom) {
      // Create a new object with the overridden price
      return { ...product, price: custom.price } as IProduct;
    }
    return product;
  });
}

export async function getProducts(districtSlug?: string, admin = false): Promise<IProduct[]> {
  await connectDB();
  const filter = admin ? {} : { status: 'active' };
  const products = await ProductModel.find(filter).sort({ createdAt: -1 }).lean();
  return applyDistrictPricing(products as IProduct[], districtSlug);
}

export async function getProductsByIds(ids: string[], districtSlug?: string): Promise<IProduct[]> {
  await connectDB();
  if (ids.length === 0) return [];
  const products = await ProductModel.find({ _id: { $in: ids } }).lean();
  return applyDistrictPricing(products as IProduct[], districtSlug);
}

export async function getProductById(id: string, districtSlug?: string): Promise<IProduct | null> {
  await connectDB();
  const product = await ProductModel.findById(id).lean();
  if (!product) return null;
  const resolved = await applyDistrictPricing([product as IProduct], districtSlug);
  return resolved[0] || null;
}

export async function createProduct(data: Partial<IProduct>): Promise<IProduct> {
  await connectDB();
  return ProductModel.create(data);
}

export async function updateProduct(id: string, data: Partial<IProduct>): Promise<IProduct | null> {
  await connectDB();
  return ProductModel.findByIdAndUpdate(id, data, { new: true }).lean();
}

export async function deleteProduct(id: string): Promise<IProduct | null> {
  await connectDB();
  return ProductModel.findByIdAndDelete(id).lean();
}

export async function bulkUpdateProductsStatus(ids: string[], status: "active" | "draft" | "archived") {
  await connectDB();
  return ProductModel.updateMany({ _id: { $in: ids } }, { status }).lean();
}

export async function searchProducts(query: string, districtSlug?: string, limit = 5, admin = false): Promise<IProduct[]> {
  await connectDB();
  if (!query.trim()) return [];
  
  const regex = new RegExp(query, "i");
  
  const baseFilter: any = {
    $or: [
      { name: regex },
      { description: regex }
    ]
  };
  
  if (!admin) {
    baseFilter.status = 'active';
  }

  const products = await ProductModel.find(baseFilter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
    
  return applyDistrictPricing(products as IProduct[], districtSlug);
}
