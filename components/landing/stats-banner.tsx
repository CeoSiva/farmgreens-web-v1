import { Users, Leaf, Map, UsersRound } from "lucide-react"

export function StatsBanner() {
  const stats = [
    {
      icon: Users,
      value: "30,000+",
      label: "Satisfied Customers",
    },
    {
      icon: Leaf,
      value: "50+",
      label: "Varieties of Greens",
    },
    {
      icon: Map,
      value: "7+",
      label: "Farms",
    },
    {
      icon: UsersRound,
      value: "100+",
      label: "Farmers",
    },
  ]

  return (
    <section className="w-full bg-primary/5 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-16 xl:px-24">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-4 lg:gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center space-y-3"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-300 hover:scale-110 hover:bg-primary hover:text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                    {stat.value}
                  </h3>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
