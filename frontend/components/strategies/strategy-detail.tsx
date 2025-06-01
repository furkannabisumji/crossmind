"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  PieChart,
  Pie,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Calendar, Activity, Clock, ArrowUpRight } from "lucide-react";

type Strategy = {
  id: string;
  name: string;
  description: string;
  riskLevel: string;
  estimatedApy: string;
  status: string;
  chains: string[];
  allocation: Array<{
    chain: string;
    percentage: number;
    protocols: string[];
  }>;
  createdAt: string;
};

type StrategyDetailProps = {
  strategy: Strategy;
};

export function StrategyDetail({ strategy }: StrategyDetailProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500/20 text-green-500 border-green-500/50">
            Active
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">
            Pending{" "}
          </Badge>
        );
      case "draft":
        return (
          <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/50">
            Draft
          </Badge>
        );
      default:
        return null;
    }
  };

  // Data transformation for charts
  const pieData = strategy.allocation.map((item) => ({
    name: item.chain,
    value: item.percentage,
  }));

  const barData = strategy.allocation.map((item) => ({
    name: item.chain,
    percentage: item.percentage,
  }));

  const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {strategy.name}
            </h1>
            {getStatusBadge(strategy.status)}
          </div>
          <p className="text-muted-foreground mt-1">{strategy.description}</p>
        </div>
        <div className="flex gap-2">
          {strategy.status === "pending" && (
            <>
              <Button variant="outline">Reject</Button>
              <Button>Approve</Button>
            </>
          )}
          {strategy.status === "active" && (
            <Button variant="outline">Deactivate</Button>
          )}
          {strategy.status === "draft" && <Button>Finalize</Button>}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{strategy.riskLevel}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Estimated APY</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{strategy.estimatedApy}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Created On</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{formatDate(strategy.createdAt)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Chains</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {strategy.chains.map((chain) => (
                <Badge key={chain} variant="outline">
                  {chain}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="allocation">
        <TabsList>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="allocation" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Chain Distribution</CardTitle>
              <CardDescription>
                Asset allocation across different blockchains
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                      />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `${value}%`} />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Bar dataKey="percentage" fill="hsl(var(--primary))">
                        {barData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {strategy.allocation.map((item, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{item.chain}</CardTitle>
                  <CardDescription>
                    {item.percentage}% Allocation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Protocols</h4>
                      <div className="flex flex-wrap gap-2">
                        {item.protocols.map((protocol) => (
                          <Badge key={protocol} variant="outline">
                            {protocol}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button variant="outline" size="sm" className="w-full">
                      View Details <ArrowUpRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Historical performance of this strategy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64">
                <Activity className="h-16 w-16 text-muted-foreground" />
                <p className="ml-4 text-muted-foreground">
                  Performance data will be available once the strategy is
                  active.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Strategy History</CardTitle>
              <CardDescription>
                Changes and updates to this strategy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex">
                  <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full border">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Strategy created</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(strategy.createdAt)}
                    </p>
                  </div>
                </div>

                {strategy.status === "active" && (
                  <div className="flex">
                    <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full border">
                      <Activity className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Strategy activated</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(
                          new Date(
                            new Date(strategy.createdAt).getTime() + 86400000
                          ).toString()
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
