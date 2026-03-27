import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative flex min-h-[600px] w-full items-center justify-center overflow-hidden py-24 md:min-h-[700px] lg:min-h-[800px]">
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/banner-bg.png"
          alt="Lush organic farm at dawn"
          fill
          priority
          className="object-cover"
          quality={90}
        />
        {/* Dark overlay for text legibility */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-4 text-center md:px-8">
        <p className="mb-6 rounded-full border border-white/20 bg-white/10 px-5 py-1.5 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md">
          Farm to Table Guarantee
        </p>
        <h1 className="mb-6 text-4xl font-extrabold leading-tight text-white drop-shadow-lg md:text-5xl lg:text-7xl">
          Fresh harvest, <br className="hidden sm:block" /> delivered daily to your door.
        </h1>
        <p className="mb-10 max-w-2xl text-sm leading-relaxed text-zinc-200 drop-shadow-md md:text-base lg:text-lg">
          Experience the vibrant taste of strictly organic vegetables, fresh greens, and stone-ground batter. 
          Cultivated with care, completely free from chemicals, and sourced directly from local farmers.
        </p>
        
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <Button size="lg" className="h-14 rounded-full px-10 text-base shadow-lg transition-transform hover:scale-105" asChild>
            <Link href="/shop">
              Shop Fresh Now <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="h-14 rounded-full border-white/40 bg-white/10 px-10 text-base text-white backdrop-blur-md transition-colors hover:bg-white/20 hover:text-white">
            Explore Offers
          </Button>
        </div>
      </div>
    </section>
  )
}
