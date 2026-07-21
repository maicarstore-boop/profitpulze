import type { IconType } from "react-icons";
import { FiArrowUp, FiArrowDown } from "react-icons/fi";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  change,
  sublabel,
}: {
  label: string;
  value: string;
  icon: IconType;
  change?: number;
  sublabel?: string;
}) {
  const positive = (change ?? 0) >= 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="mt-1 text-2xl font-bold">{value}</div>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4.5 w-4.5" />
          </span>
        </div>
        {(change !== undefined || sublabel) && (
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            {change !== undefined && (
              <span className={cn("flex items-center gap-0.5 font-medium", positive ? "text-success" : "text-danger")}>
                {positive ? <FiArrowUp className="h-3 w-3" /> : <FiArrowDown className="h-3 w-3" />}
                {Math.abs(change).toFixed(1)}%
              </span>
            )}
            {sublabel && <span className="text-muted-foreground">{sublabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
