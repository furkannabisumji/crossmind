"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function StrategyPreview() {
  const [approvalState, setApprovalState] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const handleApprove = () => {
    setApprovalState('approved');
  };

  const handleReject = () => {
    setApprovalState('rejected');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Multi-Chain Yield Optimizer</h3>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge variant="outline" className="bg-primary/10 text-primary">AI Generated</Badge>
            <Badge variant="outline" className="bg-chart-1/10 text-chart-1">Moderate Risk</Badge>
            <Badge variant="outline" className="bg-chart-4/10 text-chart-4">12.4% APY</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {approvalState === 'pending' && (
            <>
              <Button size="sm" variant="outline" onClick={handleReject}>
                <X className="mr-1 h-4 w-4" /> Reject
              </Button>
              <Button size="sm" onClick={handleApprove}>
                <Check className="mr-1 h-4 w-4" /> Approve
              </Button>
            </>
          )}
          {approvalState === 'approved' && (
            <Badge className="bg-green-500/20 text-green-500 border-green-500/50">
              <Check className="mr-1 h-3 w-3" /> Approved & Active
            </Badge>
          )}
          {approvalState === 'rejected' && (
            <Badge className="bg-red-500/20 text-red-500 border-red-500/50">
              <X className="mr-1 h-3 w-3" /> Rejected
            </Badge>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border p-4">
            <h4 className="font-medium mb-2">Avalanche (50%)</h4>
            <Progress value={80} className="h-2 mb-2" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aave Lending</span>
                <span>$400.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trader Joe LP</span>
                <span>$100.00</span>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border p-4">
            <h4 className="font-medium mb-2">Base (30%)</h4>
            <Progress value={60} className="h-2 mb-2" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aerodrome LP</span>
                <span>$200.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Balancer Pool</span>
                <span>$100.00</span>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border p-4">
            <h4 className="font-medium mb-2">Arbitrum (20%)</h4>
            <Progress value={40} className="h-2 mb-2" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">GMX Trading</span>
                <span>$150.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Radiant Lending</span>
                <span>$50.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="rounded-lg bg-muted p-4">
        <div className="flex items-start gap-3">
          <RefreshCw className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <h4 className="font-medium">AI Rebalancing Schedule</h4>
            <p className="text-sm text-muted-foreground mt-1">
              CrossMind will monitor market conditions and automatically rebalance your portfolio when significant opportunities are detected. Last rebalance: 2 days ago
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}