import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ConvertForm } from "@/components/convert/convert-form";

export const metadata: Metadata = {
  title: "Convert — ProfitPulze",
};

export default function ConvertPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Convert"
        title="Swap assets instantly"
        description="No order book, no slippage surprises — just a simple quote-and-swap experience."
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Suspense fallback={null}>
          <ConvertForm />
        </Suspense>
      </div>
    </div>
  );
}
