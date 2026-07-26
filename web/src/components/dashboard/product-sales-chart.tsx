
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  BarProps
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const chartConfig = {
  total: {
    label: 'Ventas (C$)',
    color: '#10b981', // Emerald 500
  },
};

interface ChartDataItem {
  name: string;
  total: number;
}

interface ProductSalesChartProps {
  data: ChartDataItem[];
}

export function ProductSalesChart({ data }: ProductSalesChartProps) {
  return (
    <Card className="rounded-3xl border-none shadow-xl bg-white overflow-hidden">
      <CardHeader className="bg-slate-50/50">
        <CardTitle className="text-xl font-black uppercase tracking-tight text-slate-800">Top 10 Productos</CardTitle>
        <CardDescription className="font-bold text-slate-400 uppercase text-xs">
          Artículos con mejores ventas en el período
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 30, right: 30 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f1f5f9" />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                className="capitalize font-black text-[10px] text-slate-400"
                width={100}
                tickFormatter={(val) => val.length > 12 ? val.substring(0, 10) + '..' : val}
              />
              <XAxis dataKey="total" type="number" hide />
              <ChartTooltip
                cursor={{ fill: '#f0fdf4' }}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar
                dataKey="total"
                fill="#10b981"
                radius={[0, 10, 10, 0]}
                barSize={32}
                {...({ layout: 'vertical' } as BarProps)}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
