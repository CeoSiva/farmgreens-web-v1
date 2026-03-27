import { getProducts } from "@/lib/data/product"
import { AddProductButton } from "@/components/product-actions"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import {
  EditProductButton,
  DeleteProductButton,
  BulkUploadProductsButton,
} from "@/components/product-actions"
import { InlineImageUpload } from "@/components/inline-image-upload"

export const dynamic = "force-dynamic"

export default async function ProductsPage() {
  const rawProducts = await getProducts()
  const products = rawProducts.map((p) => ({
    _id: p._id.toString(),
    name: p.name,
    category: p.category,
    description: p.description,
    price: p.price,
    status: p.status,
    orderQuantity: p.orderQuantity,
    imageUrl: p.imageUrl,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage your store&apos;s products and their configurations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <BulkUploadProductsButton />
          <AddProductButton />
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto no-scrollbar">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead className="hidden lg:table-cell">Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="hidden md:table-cell">Order Setup</TableHead>
              <TableHead className="hidden sm:table-cell text-center">Status</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product._id}>
                  <TableCell>
                    {product.imageUrl ? (
                      <div className="relative h-10 w-10 overflow-hidden rounded-md border">
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border bg-muted">
                        <InlineImageUpload productId={product._id} />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{product.name}</span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground lg:hidden">
                        {product.category}
                      </span>
                    </div>
                    {product.description && (
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {product.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell capitalize">
                    {product.category}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-semibold">₹{product.price.toFixed(2)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="capitalize text-[10px] px-1.5 py-0 h-5">
                        {product.orderQuantity.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        ({product.orderQuantity.unit})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-center">
                    <Badge
                      variant={
                        product.status === "active"
                          ? "default"
                          : product.status === "draft"
                            ? "secondary"
                            : "outline"
                      }
                      className="capitalize"
                    >
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <EditProductButton product={product} />
                      <DeleteProductButton
                        id={product._id}
                        name={product.name}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
