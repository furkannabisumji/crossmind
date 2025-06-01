"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowUpRight } from "lucide-react";

type StrategyCardProps = {
  strategy: {
    id: string;
    name: string;
    description: string;
    riskLevel: string;
    estimatedApy: string;
    status: string;
    chains: string[];
    createdAt: string;
  };
  onClick: () => void;
};

export function StrategyCard({ strategy, onClick }: StrategyCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/50">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">Pending Approval</Badge>;
      case 'draft':
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/50">Draft</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{strategy.name}</CardTitle>
          {getStatusBadge(strategy.status)}
        </div>
        <CardDescription>{strategy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Risk Level</p>
              <p className="font-medium">{strategy.riskLevel}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Est. APY</p>
              <p className="font-medium">{strategy.estimatedApy}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-2">Chains</p>
            <div className="flex flex-wrap gap-2">
              {strategy.chains.map((chain) => (
                <Badge key={chain} variant="outline">
                  {chain}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="mr-1 h-3 w-3" />
          {formatDate(strategy.createdAt)}
        </div>
        <Button variant="ghost" size="sm" onClick={onClick}>
          View Details <ArrowUpRight className="ml-1 h-3 w-3" />
        </Button>
      </CardFooter>
    </Card>
  );
}