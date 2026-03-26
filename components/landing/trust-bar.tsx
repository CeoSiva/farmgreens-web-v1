import { Truck, ShieldCheck, Undo2, BadgePercent } from "lucide-react"

export function TrustBar() {
  const features = [
    {
      icon: <Truck className="h-6 w-6" />,
      title: "Free Delivery",
      subtitle: "On all orders above ₹500",
    },
    {
      icon: <ShieldCheck className="h-6 w-6" />,
      title: "Safe Payment",
      subtitle: "100% secure checkouts",
    },
    {
      icon: <Undo2 className="h-6 w-6" />,
      title: "Money Back",
      subtitle: "If you are not satisfied",
    },
    {
      icon: <BadgePercent className="h-6 w-6" />,
      title: "Best Prices",
      subtitle: "Farm direct, no middlemen",
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
