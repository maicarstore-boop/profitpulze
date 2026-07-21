"use client";

import { useState } from "react";
import { FiCopy, FiCheck } from "react-icons/fi";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const REFERRAL_LINK = "https://profitpulze.com/r/PULSE2026";

export function ReferralLinkCard() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(REFERRAL_LINK);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="font-semibold">Your referral link</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Share this link — you and your friend both earn trading fee rebates.
        </p>
        <div className="mt-4 flex gap-2">
          <Input value={REFERRAL_LINK} readOnly className="flex-1" />
          <Button variant="outline" onClick={handleCopy}>
            {copied ? <FiCheck className="h-4 w-4 text-success" /> : <FiCopy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold">18</div>
            <div className="text-xs text-muted-foreground">Referrals</div>
          </div>
          <div>
            <div className="text-xl font-bold">$1,240.50</div>
            <div className="text-xs text-muted-foreground">Total Earned</div>
          </div>
          <div>
            <div className="text-xl font-bold">20%</div>
            <div className="text-xs text-muted-foreground">Commission Rate</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
