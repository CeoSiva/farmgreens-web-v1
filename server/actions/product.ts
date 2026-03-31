"use server";

import { revalidatePath } from "next/cache";
import { ProductSchema, ProductFormValues } from "@/lib/schemas/product";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  bulkUpdateProductsStatus
} from "@/lib/data/product";

export async function bulkUpdateProductStatusAction(ids: string[], status: "active" | "draft" | "archived") {
  try {
    if (!ids || ids.length === 0) return { error: "No products selected" };
    await bulkUpdateProductsStatus(ids, status);
    revalidatePath("/fmg-admin/products");
    return { success: true };
  } catch (error) {
    console.error("Bulk Update Products Error:", error);
    return { error: "Failed to update products status" };
  }
}

export async function createProductAction(formData: ProductFormValues) {
  try {
    const parsed = ProductSchema.safeParse(formData);
    if (!parsed.success) {
      return { error: "Invalid product data data" };
    }

    const newProduct = await createProduct(parsed.data as any);
    
    // Convert Mongoose Doc to plain object safely handling ObjectIds and Dates
    const plainProduct = JSON.parse(JSON.stringify(newProduct));

    revalidatePath("/fmg-admin/products");
    return { success: true, product: plainProduct };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("Create Product Action Error:", err);
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

    const updatedProduct = await updateProduct(id, parsed.data as any);
    
    if (!updatedProduct) {
      return { error: "Product not found" };
    }
    
    revalidatePath("/fmg-admin/products");
    return { success: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("Update Product Action Error:", err);
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

export async function updateProductImageAction(id: string, imageUrl: string) {
  try {
    const updatedProduct = await updateProduct(id, { imageUrl } as any);
    if (!updatedProduct) {
      return { error: "Product not found" };
    }
    revalidatePath("/fmg-admin/products");
    return { success: true };
  } catch (error) {
    console.error("Update Product Image Error:", error);
    return { error: "Failed to update product image" };
  }
}

export async function searchProductsAction(query: string, districtSlug?: string) {
  try {
    const { searchProducts } = await import("@/lib/data/product");
    const rawMatches = await searchProducts(query, districtSlug);
    const matches = JSON.parse(JSON.stringify(rawMatches));
    return { success: true, matches };
  } catch (error) {
    console.error("Search Action Error:", error);
    return { error: "Failed to search products" };
  }
}

