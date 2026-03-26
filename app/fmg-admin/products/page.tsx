import { getProducts } from "@/lib/data/product";
import { AddProductButton } from "@/components/product-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage your store&apos;s products and their order configurations.
          </p>
        </div>
        <AddProductButton />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Order Setup</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product._id.toString()}>
                  <TableCell className="font-medium">
                    {product.name}
                    {product.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {product.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>{product.sku || "-"}</TableCell>
                  <TableCell>₹{product.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="capitalize">
                        {product.orderQuantity.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        (Step: {product.orderQuantity.step}{" "}
                        {product.orderQuantity.unit})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}