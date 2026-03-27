import { Leaf, Truck, MapPin, Banknote } from "lucide-react"

export function TrustBar() {
  const features = [
    {
      icon: <Leaf className="h-6 w-6" />,
      title: "Daily Harvest",
      subtitle: "Fresh from farm to your door",
    },
    {
      icon: <Truck className="h-6 w-6" />,
      title: "Fast Delivery",
      subtitle: "Delivered within 24 hours",
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      title: "Locally Grown",
      subtitle: "Grown in your community",
    },
    {
      icon: <Banknote className="h-6 w-6" />,
      title: "Pay on Delivery",
      subtitle: "Safe Cash on Delivery (COD)",
    },
  ]

  return (
    <section className="w-full bg-muted py-10 md:py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-8 xl:px-24">
        <div className="grid grid-cols-2 gap-y-10 md:grid-cols-4 md:gap-x-6 md:gap-y-0 text-foreground">
          {features.map((feature, idx) => (
            <div 
              key={idx} 
              className={`flex flex-col items-center justify-center text-center md:flex-row md:items-start md:text-left ${
                idx !== features.length - 1 ? "md:border-r md:border-border/50" : ""
              }`}
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary md:mb-0 md:mr-4">
                {feature.icon}
              </div>
              <div className="md:pr-4">
                <h4 className="font-semibold">{feature.title}</h4>
                <p className="mt-1 text-xs text-muted-foreground">{feature.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
