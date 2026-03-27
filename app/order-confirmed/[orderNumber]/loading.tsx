import { Card } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-8 lg:px-16 xl:px-24">
      <Card className="p-6">
        <div className="h-6 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-4 w-64 animate-pulse rounded bg-muted" />
        <div className="mt-6 h-4 w-48 animate-pulse rounded bg-muted" />
      </Card>
    </div>
  )
}
