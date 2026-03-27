import { connectDB } from "../db";
import ProductModel, { IProduct } from "../models/product";

export async function getProducts(): Promise<IProduct[]> {
  await connectDB();
  return ProductModel.find().sort({ createdAt: -1 }).lean();
}

export async function getProductsByIds(ids: string[]): Promise<IProduct[]> {
  await connectDB();
  if (ids.length === 0) return [];
  return ProductModel.find({ _id: { $in: ids } }).lean();
}

export async function getProductById(id: string): Promise<IProduct | null> {
  await connectDB();
  return ProductModel.findById(id).lean();
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

export async function searchProducts(query: string, limit = 5): Promise<IProduct[]> {
  await connectDB();
  if (!query.trim()) return [];
  
  const regex = new RegExp(query, "i");
  return ProductModel.find({
    $or: [
      { name: regex },
      { description: regex }
    ]
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}
