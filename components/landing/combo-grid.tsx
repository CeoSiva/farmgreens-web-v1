"use client"

import { LocationAwareLink as Link } from "@/components/location-aware-link"
import { ArrowRight } from "lucide-react"
import { ComboCard, SerializedCombo } from "@/components/combo/ComboCard"
import { Button } from "@/components/ui/button"

interface ComboGridProps {
  title: string
  combos: SerializedCombo[]
  districtId: string
  seeAllLink?: string
}

export function ComboGrid({
  title,
  combos,
  districtId,
  seeAllLink,
}: ComboGridProps) {
  if (!combos || combos.length === 0) {
    return null
  }

  return (
    <section className="w-full py-8 pl-4 md:px-8 md:py-12 md:pl-0 lg:px-16 xl:px-24">
      <div className="mx-auto max-w-7xl md:px-0">
        {/* Section Header */}
        <div className="mb-4 flex items-center justify-between pr-4 md:mb-6 md:pr-0">
          <h2 className="text-xl font-bold text-foreground md:text-2xl">
            {title}
          </h2>
          {seeAllLink && (
            <Link
              href={seeAllLink}
              className="group flex items-center text-sm font-medium text-primary hover:underline"
            >
              See All{" "}
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>

        {/* Horizontal Scroll Grid */}
        <div className="no-scrollbar flex snap-x gap-2 overflow-x-auto sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {combos.map((combo) => (
            <div
              key={combo._id}
              className="max-w-[160px] min-w-[140px] shrink-0 snap-start sm:max-w-none sm:min-w-0"
            >
              <ComboCard combo={combo} districtId={districtId} />
            </div>
          ))}
        </div>

        {/* Show More Button */}
        {seeAllLink && combos.length > 0 && (
          <div className="mt-12 flex justify-center">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full px-8 font-semibold shadow-sm transition-all hover:shadow-md active:scale-95"
            >
              <Link href={seeAllLink}>
                View All Combos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
