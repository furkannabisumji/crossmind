"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/components/wallet-provider";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function CTASection() {
  const { isConnected, connect } = useWallet();
  
  return (
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="container">
        <motion.div 
          className="mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Ready to experience the future of DeFi?
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/80">
            Join CrossMind today and let AI optimize your crypto investments across multiple chains.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {isConnected ? (
              <Button 
                size="lg" 
                variant="secondary"
                asChild
                className="group"
              >
                <Link href="/dashboard">
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            ) : (
              <Button 
                size="lg" 
                variant="secondary"
                onClick={connect}
              >
                Connect Wallet <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}