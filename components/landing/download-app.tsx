import { FiSmartphone } from "react-icons/fi";
import { FaApple, FaGooglePlay } from "react-icons/fa";
import { Card } from "@/components/ui/card";

export function DownloadApp() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Card className="overflow-hidden bg-gradient-to-br from-card to-muted">
        <div className="grid items-center gap-8 p-8 sm:p-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              <FiSmartphone className="h-3.5 w-3.5 text-primary" />
              Mobile App
            </span>
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
              Trade anywhere with the ProfitPulze app
            </h2>
            <p className="mt-3 max-w-md text-muted-foreground">
              Gesture trading, one-hand mode, biometric login, and real-time push
              alerts — a full trading desk in your pocket.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#"
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent"
              >
                <FaApple className="h-5 w-5" />
                App Store
              </a>
              <a
                href="#"
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent"
              >
                <FaGooglePlay className="h-4 w-4" />
                Google Play
              </a>
            </div>
          </div>

          <div className="mx-auto flex h-64 w-full max-w-xs items-center justify-center rounded-2xl border border-border bg-background/60">
            <FiSmartphone className="h-16 w-16 text-muted-foreground" />
          </div>
        </div>
      </Card>
    </section>
  );
}
