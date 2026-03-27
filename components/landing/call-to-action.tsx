import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CallToAction() {
  return (
    <section className="relative w-full overflow-hidden bg-muted py-20 md:py-28">
      {/* Left Decorative Image */}
      <div className="absolute left-0 top-0 hidden h-full w-1/4 opacity-80 md:block mix-blend-multiply">
        <Image
          src="/cta_farm_left.webp"
          alt="Lush organic farm at sunrise"
          fill
          className="object-cover mask-image-to-r"
          style={{ maskImage: "linear-gradient(to right, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 100%)", WebkitMaskImage: "linear-gradient(to right, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)" }}
        />
      </div>

      {/* Right Decorative Image */}
      <div className="absolute right-0 top-0 hidden h-full w-1/4 opacity-80 md:block mix-blend-multiply">
        <Image
          src="/cta_farm_right.webp"
          alt="Hands holding fresh soil and sprouts"
          fill
          className="object-cover mask-image-to-l"
          style={{ maskImage: "linear-gradient(to left, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 100%)", WebkitMaskImage: "linear-gradient(to left, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)" }}
        />
      </div>

      {/* Center Content */}
      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 text-center z-10">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Join the FarmGreens Family
        </p>
        <h2 className="mb-6 text-3xl font-bold leading-tight text-foreground md:text-5xl">
          Eat healthier, support locals, and taste the difference.
        </h2>
        <p className="mb-8 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Sign up today and get an exclusive 15% off your first fresh harvest delivery. 
          No commitments, just pure organic goodness straight to your kitchen.
        </p>
        <Button size="lg" className="rounded-full px-8 h-14 text-base shadow-sm group">
          Get Started Now
          <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </section>
  )
}
