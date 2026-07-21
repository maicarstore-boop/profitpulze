"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowRight, FiShield, FiZap, FiGlobe } from "react-icons/fi";
import { Button } from "@/components/ui/button";

const STATS = [
  { label: "24h Trading Volume", value: "$84.6B" },
  { label: "Registered Users", value: "42M+" },
  { label: "Listed Assets", value: "480+" },
  { label: "Countries Supported", value: "160+" },
];

export function Hero({
  headline = "Trade crypto with confidence",
  subheadline = "Spot, margin, and futures trading with institutional-grade infrastructure, deep liquidity, and an AI assistant that helps you understand every move.",
}: {
  headline?: string;
  subheadline?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, color-mix(in oklab, var(--primary) 18%, transparent), transparent)",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
          >
            <FiZap className="h-3.5 w-3.5 text-primary" />
            Now supporting 480+ assets across 9 chains
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-6 bg-gradient-to-r from-foreground to-primary bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-6xl"
          >
            {headline}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground"
          >
            {subheadline}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link href="/register">
              <Button size="lg">
                Get Started Free
                <FiArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/markets">
              <Button size="lg" variant="outline">
                Explore Markets
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
          >
            <span className="flex items-center gap-1.5">
              <FiShield className="h-3.5 w-3.5 text-success" /> Cold storage secured
            </span>
            <span className="flex items-center gap-1.5">
              <FiZap className="h-3.5 w-3.5 text-success" /> Sub-millisecond matching
            </span>
            <span className="flex items-center gap-1.5">
              <FiGlobe className="h-3.5 w-3.5 text-success" /> Available in 160+ countries
            </span>
          </motion.div>
        </div>

        <motion.dl
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4"
        >
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <dt className="text-xs text-muted-foreground">{stat.label}</dt>
              <dd className="mt-1 text-2xl font-bold sm:text-3xl">{stat.value}</dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}
