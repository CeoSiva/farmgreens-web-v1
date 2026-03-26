import { ArrowRight, Leaf, ShieldCheck, Sprout } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function InfoCards() {
  const cards = [
    {
      id: 1,
      title: "Direct from Farms",
      description: "We partner directly with local, certified organic farmers to bring you produce within 24 hours of harvest.",
      icon: <Sprout className="h-8 w-8 text-green-700" />,
      bg: "bg-green-50",
    },
    {
      id: 2,
      title: "100% Organic Certified",
      description: "Absolutely no synthetic pesticides or harmful chemicals. We guarantee completely natural farming protocols.",
      icon: <ShieldCheck className="h-8 w-8 text-amber-700" />,
      bg: "bg-amber-50",
    },
    {
      id: 3,
      title: "Fresh Traditional Batter",
      description: "Stone-ground daily using premium grains. Experience authentic taste and zero added preservatives.",
      icon: <Leaf className="h-8 w-8 text-blue-700" />,
      bg: "bg-blue-50",
    },
  ]

  return (
    <section className="w-full px-4 py-8 md:px-8 lg:px-16 xl:px-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
        {cards.map((card) => (
          <Card key={card.id} className={`overflow-hidden rounded-2xl border-none ${card.bg} shadow-sm transition-transform hover:-translate-y-1`}>
            <CardContent className="flex h-full flex-col items-start p-6 md:p-8">
              <div className="mb-4 rounded-xl bg-white/60 p-3 shadow-sm backdrop-blur-sm">
                {card.icon}
              </div>
              <h3 className="mb-2 text-lg font-bold text-foreground">{card.title}</h3>
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                {card.description}
              </p>
              <Button variant="ghost" className="mt-auto -ml-4 group font-semibold">
                Learn More 
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
