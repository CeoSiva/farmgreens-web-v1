import { LocationAwareLink as Link } from "@/components/location-aware-link"
import { ArrowRight } from "lucide-react"
import { ProductCard, SerializedProduct } from "@/components/landing/product-card"
import { Button } from "@/components/ui/button"

interface ProductGridProps {
  title: string
  products: SerializedProduct[]
  seeAllLink?: string
}

export function ProductGrid({ title, products, seeAllLink }: ProductGridProps) {
  return (
    <section className="w-full pl-4 py-8 md:pl-0 md:px-8 md:py-12 lg:px-16 xl:px-24">
      <div className="mx-auto max-w-7xl md:px-0">
        {/* Section Header */}
        <div className="mb-4 pr-4 md:mb-6 flex items-center justify-between md:pr-0">
          <h2 className="text-xl font-bold text-foreground md:text-2xl">{title}</h2>
          {seeAllLink && (
            <Link
              href={seeAllLink}
              className="group flex items-center text-sm font-medium text-primary hover:underline"
            >
              See All <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>

        {/* Grid Layout */}
        {products.length === 0 ? (
          <div className="mr-4 flex flex-1 items-center justify-center rounded-xl border border-dashed p-12 text-muted-foreground md:mr-0">
            No products available at the moment.
          </div>
        ) : (
          <>
            <div className="no-scrollbar flex gap-2 overflow-x-auto snap-x sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:gap-6 sm:overflow-visible sm:pb-0">
              {products.map((product) => (
                <div key={product._id} className="min-w-[115px] max-w-[125px] shrink-0 snap-start sm:min-w-0 sm:max-w-none">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            {/* Show More Button */}
            {seeAllLink && products.length > 0 && (
              <div className="mt-12 flex justify-center">
                <Button 
                  asChild 
                  variant="outline" 
                  size="lg" 
                  className="rounded-full px-8 font-semibold shadow-sm hover:shadow-md transition-all active:scale-95"
                >
                  <Link href={seeAllLink}>
                    Show More Products
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
