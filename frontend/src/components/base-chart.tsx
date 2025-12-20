import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "frontend/src/components/ui/card";
import { ResponsiveContainer } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "frontend/src/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts";

interface BaseChartProps {
  title: string;
  data: any[];
  type: "bar" | "line" | "pie";
  dataKeys: string[];
  labelKey?: string; // Optional, used for pie charts to specify the label
  colors: string[];
  className?: string;
  config?: Record<string, { label: string; color: string }>;
}

export function BaseChart({ title, data, type, dataKeys, colors, className, config, labelKey }: BaseChartProps) {
  const chartConfig = React.useMemo(() => {
    const baseConfig = config || {};
    // Use labelKey for pie chart labels, otherwise fallback to key
    return dataKeys.reduce((acc, key, index) => {
      if (!acc[key]) {
        acc[key] = {
          label: labelKey && type === "pie" ? labelKey : key,
          color: colors[index % colors.length]
        };
      }
      return acc;
    }, { ...baseConfig });
  }, [config, dataKeys, colors, labelKey, type]);

  const renderChart = () => {
    switch (type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height="55%">
            <BarChart data={data}>
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              {dataKeys.map((key, index) => (
                <Bar key={key} dataKey={key} fill={colors[index]} stackId="a" />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              {dataKeys.map((key, index) => (
                <Line 
                  key={key} 
                  type="monotone" 
                  dataKey={key} 
                  stroke={colors[index].startsWith("var") ? `hsl(${colors[index]})` : colors[index]} 
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <ChartLegend formatter={(value) => {
                // Find the entry in data with value as name
                const entry = data.find((d) => d.name === value);
                return entry ? entry.name : value;
              }} />
              <Pie 
                data={data} 
                cx="50%" 
                cy="50%" 
                outerRadius={80} 
                dataKey={dataKeys[0]} 
                label={({ name }) => name}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <Card className={`bg-card ${className}`}>
      {title && (
        <CardHeader>
          <CardTitle className="text-foreground">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <ChartContainer config={chartConfig}>
          {renderChart()}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
