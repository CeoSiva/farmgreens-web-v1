"use server";

import { revalidatePath } from "next/cache";
import { ProductSchema, ProductFormValues } from "@/lib/schemas/product";
import {
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/lib/data/product";

export async function createProductAction(formData: ProductFormValues) {
  try {
    const parsed = ProductSchema.safeParse(formData);
    if (!parsed.success) {
      return { error: "Invalid product data data" };
    }

    const newProduct = await createProduct(parsed.data);
    
    // Convert Mongoose Doc to plain object for client to avoid hydration issues
    const plainProduct = {
      ...newProduct,
      _id: newProduct._id.toString(),
      createdAt: newProduct.createdAt?.toISOString(),
      updatedAt: newProduct.updatedAt?.toISOString(),
    };

    revalidatePath("/fmg-admin/products");
    return { success: true, product: plainProduct };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Create Product Action Error:", error);
    if (error.code === 11000) {
       return { error: "A product with this SKU already exists." };
    }
    return { error: "Failed to create product" };
  }
}

export async function updateProductAction(
  id: string,
  formData: ProductFormValues
) {
  try {
    const parsed = ProductSchema.safeParse(formData);
    if (!parsed.success) {
      return { error: "Invalid product data" };
    }

    const updatedProduct = await updateProduct(id, parsed.data);
    
    if (!updatedProduct) {
      return { error: "Product not found" };
    }
    
    revalidatePath("/fmg-admin/products");
    return { success: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Update Product Action Error:", error);
    if (error.code === 11000) {
       return { error: "A product with this SKU already exists." };
    }
    return { error: "Failed to update product" };
  }
}

export async function deleteProductAction(id: string) {
  try {
    const deletedProduct = await deleteProduct(id);
    
    if (!deletedProduct) {
      return { error: "Product not found" };
    }
    
    revalidatePath("/fmg-admin/products");
    return { success: true };
  } catch (error) {
    console.error("Delete Product Action Error:", error);
    return { error: "Failed to delete product" };
  }
}
