import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export function PromoBanners() {
  return (
    <section className="w-full px-4 py-8 md:px-8 md:py-12 lg:px-16 xl:px-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6">
        {/* Banner 1: Darker tinted left banner */}
        <Card className="relative overflow-hidden rounded-2xl border-none bg-primary/10 shadow-none">
          <CardContent className="flex h-full min-h-[250px] flex-col justify-center p-6 md:min-h-[300px] md:p-8 lg:p-10 z-10 relative">
            <Badge className="w-fit rounded-full bg-primary text-white hover:bg-primary px-3 py-1 mb-4">
              Weekly Special
            </Badge>
            <h3 className="mb-2 max-w-[70%] text-2xl font-bold leading-tight text-foreground md:text-3xl">
              Fresh Greens <br/> Harvest Box
            </h3>
            <p className="mb-6 max-w-[60%] text-sm text-muted-foreground">
              Up to 20% off on all seasonal leafy greens. Handpicked this morning.
            </p>
            <Button className="w-fit rounded-full group">
              Shop Now <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            
            {/* Background Image Absolute Right */}
            <div className="absolute -bottom-8 -right-8 h-48 w-48 md:h-64 md:w-64 opacity-90 mix-blend-multiply">
               <Image 
                 src="/promo_banner_left.webp" 
                 alt="Fresh greens" 
                 fill 
                 className="object-cover rounded-full" 
               />
            </div>
          </CardContent>
        </Card>

        {/* Banner 2: Lighter neutral right banner */}
        <Card className="relative overflow-hidden rounded-2xl border border-border/50 bg-muted/40 shadow-none">
          <CardContent className="flex h-full min-h-[250px] flex-col justify-center p-6 md:min-h-[300px] md:p-8 lg:p-10 z-10 relative">
            <Badge variant="outline" className="w-fit rounded-full border-primary/50 text-primary px-3 py-1 mb-4 bg-white/50 backdrop-blur-sm">
              New Arrival
            </Badge>
            <h3 className="mb-2 max-w-[70%] text-2xl font-bold leading-tight text-foreground md:text-3xl">
              Organic Root <br/> Veggies
            </h3>
            <p className="mb-6 max-w-[60%] text-sm text-muted-foreground">
              Rich in nutrients. Try our new baby carrots and beetroots.
            </p>
            <Button variant="outline" className="w-fit rounded-full bg-white/50 backdrop-blur-sm group">
              Explore <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            
            {/* Background Image Absolute Right */}
            <div className="absolute -bottom-4 -right-4 h-48 w-48 md:h-64 md:w-64 opacity-90 mix-blend-multiply">
               <Image 
                 src="/promo_banner_right.webp" 
                 alt="Root vegetables" 
                 fill 
                 className="object-cover rounded-full" 
               />
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
