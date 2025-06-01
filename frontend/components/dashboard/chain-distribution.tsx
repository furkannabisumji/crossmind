"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const data = [
  { name: 'Avalanche', value: 500, color: 'hsl(var(--chart-1))' },
  { name: 'Base', value: 300, color: 'hsl(var(--chart-2))' },
  { name: 'Arbitrum', value: 200, color: 'hsl(var(--chart-3))' },
  { name: 'Ethereum', value: 150, color: 'hsl(var(--chart-4))' },
  { name: 'Polygon', value: 100, color: 'hsl(var(--chart-5))' },
];

export function ChainDistribution() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Chain Distribution</CardTitle>
        <CardDescription>Your assets across different blockchains</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
                formatter={(value: number) => [`$${value}`, 'Value']}
              />
              <Legend
                layout="vertical"
                verticalAlign="middle"
                align="right"
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}