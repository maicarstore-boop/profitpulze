import { FiStar } from "react-icons/fi";
import { Card, CardContent } from "@/components/ui/card";

const TESTIMONIALS = [
  {
    quote:
      "The order execution speed is genuinely different from anything else I've used. Even during volatile sessions, fills are near-instant.",
    name: "Priya Nair",
    role: "Full-time trader",
  },
  {
    quote:
      "Staking rewards land automatically and the dashboard makes it trivial to see exactly what I'm earning and where.",
    name: "Marco Bellini",
    role: "Long-term holder",
  },
  {
    quote:
      "I moved my portfolio here mainly for the security posture — proof of reserves and passkey login sealed it for me.",
    name: "Aiden Cole",
    role: "DeFi engineer",
  },
];

export function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">Trusted by traders worldwide</h2>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <Card key={t.name}>
            <CardContent className="pt-6">
              <div className="flex gap-0.5 text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <FiStar key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-4 text-sm">
                <div className="font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
