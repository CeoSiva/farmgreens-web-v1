import { connectDB } from "../db";
import ProductModel, { IProduct } from "../models/product";

export async function getProducts(): Promise<IProduct[]> {
  await connectDB();
  return ProductModel.find().sort({ createdAt: -1 }).lean();
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
