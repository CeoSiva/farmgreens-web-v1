import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { Card } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Navbar />
      <main className="w-full flex-1 px-4 py-10 md:px-8 lg:px-16 xl:px-24">
        <div className="mx-auto max-w-2xl">
          <div className="grid gap-6">
            {/* Success Header Skeleton */}
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="h-16 w-16 animate-pulse rounded-full bg-muted" />
              <div className="h-7 w-48 animate-pulse rounded bg-muted" />
              <div className="h-4 w-64 animate-pulse rounded bg-muted" />
            </div>

            {/* Order Info Bar Skeleton */}
            <div className="flex items-center justify-between rounded-lg border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                <div className="h-5 w-16 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-4 w-40 animate-pulse rounded bg-muted" />
            </div>

            {/* Contact & Address Skeleton */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="p-4">
                <div className="mb-3 h-4 w-20 animate-pulse rounded bg-muted" />
                <div className="space-y-2">
                  <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                </div>
              </Card>
              <Card className="p-4">
                <div className="mb-3 h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="space-y-2">
                  <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                </div>
              </Card>
            </div>

            {/* Items Skeleton */}
            <Card className="p-4">
              <div className="mb-3 h-4 w-16 animate-pulse rounded bg-muted" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border bg-background p-3"
                  >
                    <div className="space-y-2">
                      <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="space-y-2 text-right">
                      <div className="ml-auto h-3 w-12 animate-pulse rounded bg-muted" />
                      <div className="ml-auto h-4 w-16 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Payment Summary Skeleton */}
            <div className="rounded-2xl bg-slate-900 p-6 shadow-xl">
              <div className="mb-4 h-3 w-28 animate-pulse rounded bg-white/20" />
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 w-16 animate-pulse rounded bg-white/10" />
                  <div className="h-4 w-20 animate-pulse rounded bg-white/10" />
                </div>
                <div className="flex justify-between">
                  <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
                  <div className="h-4 w-16 animate-pulse rounded bg-white/10" />
                </div>
                <div className="my-4 h-px bg-white/10" />
                <div className="flex justify-between">
                  <div className="h-6 w-14 animate-pulse rounded bg-white/20" />
                  <div className="h-8 w-28 animate-pulse rounded bg-white/20" />
                </div>
              </div>
            </div>

            {/* Buttons Skeleton */}
            <div className="flex gap-3">
              <div className="h-10 flex-1 animate-pulse rounded-md bg-muted" />
              <div className="h-10 flex-1 animate-pulse rounded-md bg-muted" />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
