"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ProductForm } from "@/components/product-form";

export function AddProductButton() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-xl md:max-w-2xl overflow-y-auto w-full">
        <SheetHeader className="mb-2">
          <SheetTitle>Add New Product</SheetTitle>
          <SheetDescription>
            Create a new product by filling out the details below.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          <ProductForm onSuccess={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
