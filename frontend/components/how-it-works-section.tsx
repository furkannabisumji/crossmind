"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Wallet, Brain, ChevronRight, BarChart3, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    icon: <Wallet className="h-10 w-10" />,
    title: "Connect Wallet & Deposit",
    description: "Connect your wallet and deposit your assets. CrossMind supports multiple chains and tokens."
  },
  {
    icon: <Brain className="h-10 w-10" />,
    title: "AI Creates Strategy",
    description: "The AI agent analyzes market conditions and creates an optimal investment strategy based on your risk profile."
  },
  {
    icon: <BarChart3 className="h-10 w-10" />,
    title: "Cross-chain Deployment",
    description: "Your funds are automatically deployed across multiple chains and DeFi protocols to maximize returns."
  },
  {
    icon: <RefreshCw className="h-10 w-10" />,
    title: "Continuous Optimization",
    description: "The AI continuously monitors the market and rebalances your portfolio to maintain optimal performance."
  }
];

export function HowItWorksSection() {
  return (
    <section className="py-20">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How CrossMind Works
          </h2>
          <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience the power of AI-driven DeFi investment in just a few simple steps.
          </p>
        </div>

        <div className="relative">
          {/* Progress line */}
          <div className="absolute left-[28px] top-0 bottom-0 w-0.5 bg-border md:left-1/2 md:-ml-0.5" />

          <div className="space-y-12 md:space-y-0">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="relative md:grid md:grid-cols-2 md:gap-8 md:items-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className={cn(
                  "md:col-start-1 md:col-end-2",
                  index % 2 !== 0 && "md:col-start-2 md:col-end-3"
                )}>
                  <div className="flex items-center">
                    <div className="z-10 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      {step.icon}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-bold">{step.title}</h3>
                      <p className="mt-2 text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                </div>
                
                {/* Only visible in desktop to create the alternating layout */}
                <div className={cn(
                  "hidden md:block",
                  index % 2 === 0 ? "md:col-start-2 md:col-end-3" : "md:col-start-1 md:col-end-2"
                )}>
                  {/* Empty div for alignment */}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}