"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { date: 'Apr 12', value: 1000 },
  { date: 'Apr 15', value: 1020 },
  { date: 'Apr 18', value: 1070 },
  { date: 'Apr 21', value: 1060 },
  { date: 'Apr 24', value: 1120 },
  { date: 'Apr 27', value: 1140 },
  { date: 'Apr 30', value: 1180 },
  { date: 'May 3', value: 1200 },
  { date: 'May 6', value: 1245 },
];

export function PortfolioOverview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Value</CardTitle>
        <CardDescription>Your portfolio performance over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis 
                dataKey="date" 
                stroke="var(--muted-foreground)" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="var(--muted-foreground)" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={value => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
                labelStyle={{ color: 'hsl(var(--card-foreground))' }}
                formatter={(value: number) => [`$${value}`, 'Value']}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ stroke: 'hsl(var(--primary))', fill: 'hsl(var(--background))' }}
                activeDot={{ r: 6, stroke: 'hsl(var(--primary))', fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}