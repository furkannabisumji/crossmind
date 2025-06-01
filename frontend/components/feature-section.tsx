"use client";

import { motion } from "framer-motion";
import { 
  Brain, 
  BarChart3, 
  RefreshCw, 
  Shield, 
  Layers,
  Globe
} from "lucide-react";

const features = [
  {
    icon: <Brain className="h-10 w-10" />,
    title: "Agent Autonomy",
    description: "Specify your risk profile and goals. The AI agent fetches market data and selects optimal strategies."
  },
  {
    icon: <Globe className="h-10 w-10" />,
    title: "Cross-chain Execution",
    description: "Execute strategies across Avalanche, Ethereum, Base, Arbitrum, and more via Chainlink CCIP."
  },
  {
    icon: <BarChart3 className="h-10 w-10" />,
    title: "Yield Optimization",
    description: "Automatically picks the best pools/protocols to stake, lend, or provide liquidity based on up-to-date APYs."
  },
  {
    icon: <RefreshCw className="h-10 w-10" />,
    title: "Continuous Monitoring",
    description: "Uses Chainlink Automation and AI reasoning to rebalance funds as market conditions change."
  },
  {
    icon: <Shield className="h-10 w-10" />,
    title: "Security First",
    description: "Every action is secured by Chainlink's battle-tested infrastructure and on-chain verification."
  },
  {
    icon: <Layers className="h-10 w-10" />,
    title: "Transparency",
    description: "Every step, decision, and trade is logged, visible to you, and verified on-chain."
  }
];

export function FeatureSection() {
  return (
    <section 
      id="features" 
      className="py-20 bg-accent/30"
    >
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Powered by AI and Chainlink
          </h2>
          <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
            CrossMind combines AI planning with Chainlink's secure infrastructure to deliver a seamless, autonomous DeFi experience.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="rounded-lg border bg-card p-8 shadow-sm transition-all hover:shadow-md"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                {feature.icon}
              </div>
              <h3 className="mb-3 text-xl font-bold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}