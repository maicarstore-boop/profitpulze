import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ContactForm } from "@/components/support/contact-form";

export const metadata: Metadata = {
  title: "Contact Us — ProfitPulze",
};

export default function ContactPage() {
  return (
    <div>
      <PageHeader eyebrow="Contact" title="Contact Us" description="Have a question that isn't in the Help Center? Send us a message." />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <ContactForm />
      </div>
    </div>
  );
}
