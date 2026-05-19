import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Rocket, Lightbulb, TrendingUp, TrendingDown } from 'lucide-react';
import { format, subDays, subMonths, subYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface StatsCardsProps {
  dailySales: number;
  yesterdaySales: number;
  monthlySales: number;
  lastMonthSales: number;
  avgInvoice: number;
  lastMonthAvgInvoice: number;
  annualSales: number;
  lastYearSales: number;
}

const cardConfig = [
  {
    title: 'Ventas del Día',
    icon: DollarSign,
    color: 'blue',
    bgClass: 'bg-blue-50 dark:bg-blue-950/30',
    iconClass: 'text-blue-600 dark:text-blue-400',
    borderClass: 'border-l-4 border-l-blue-500',
  },
  {
    title: 'Ventas del Mes',
    icon: Rocket,
    color: 'violet',
    bgClass: 'bg-violet-50 dark:bg-violet-950/30',
    iconClass: 'text-violet-600 dark:text-violet-400',
    borderClass: 'border-l-4 border-l-violet-500',
  },
  {
    title: 'Factura Promedio',
    icon: Lightbulb,
    color: 'amber',
    bgClass: 'bg-amber-50 dark:bg-amber-950/30',
    iconClass: 'text-amber-600 dark:text-amber-400',
    borderClass: 'border-l-4 border-l-amber-500',
  },
  {
    title: 'Ventas Anuales',
    icon: TrendingUp,
    color: 'green',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    borderClass: 'border-l-4 border-l-emerald-500',
  },
];

function StatCard({
  title,
  icon: Icon,
  currentValue,
  previousValue,
  currentPeriod,
  previousPeriod,
  config,
  currency = 'C$',
}: {
  title: string;
  icon: React.ElementType;
  currentValue: number;
  previousValue: number;
  currentPeriod: string;
  previousPeriod: string;
  config: typeof cardConfig[0];
  currency?: string;
}) {
  const percentageChange =
    previousValue > 0
      ? ((currentValue - previousValue) / previousValue) * 100
      : currentValue > 0 ? 100 : 0;

  const isPositive = percentageChange >= 0;

  return (
    <Card className={cn('transition-all duration-150 hover:shadow-md', config.borderClass, config.bgClass)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-muted-foreground">{title}</span>
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', config.bgClass)}>
            <Icon className={cn('h-5 w-5', config.iconClass)} />
          </div>
        </div>
        <div className="text-2xl font-extrabold tracking-tight">
          {currency} {currentValue.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="flex items-center gap-1.5 mt-1.5">
          {isPositive ? (
            <TrendingUp className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-red-500" />
          )}
          <span className={cn('text-sm font-semibold', isPositive ? 'text-green-500' : 'text-red-500')}>
            {percentageChange.toFixed(1)}%
          </span>
          <span className="text-xs text-muted-foreground">vs {previousPeriod}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCards({
  dailySales,
  yesterdaySales,
  monthlySales,
  lastMonthSales,
  avgInvoice,
  lastMonthAvgInvoice,
  annualSales,
  lastYearSales,
}: StatsCardsProps) {
  const today = new Date();
  const yesterday = subDays(today, 1);
  const thisMonth = subMonths(today, 0);
  const lastMonth = subMonths(today, 1);
  const thisYear = subYears(today, 0);
  const lastYear = subYears(today, 1);

  const values = [
    { current: dailySales, previous: yesterdaySales, currentPeriod: format(today, 'd MMM, yyyy', { locale: es }), previousPeriod: format(yesterday, 'd MMM', { locale: es }) },
    { current: monthlySales, previous: lastMonthSales, currentPeriod: format(thisMonth, 'MMMM yyyy', { locale: es }), previousPeriod: format(lastMonth, 'MMMM', { locale: es }) },
    { current: avgInvoice, previous: lastMonthAvgInvoice, currentPeriod: format(thisMonth, 'MMMM yyyy', { locale: es }), previousPeriod: format(lastMonth, 'MMMM', { locale: es }) },
    { current: annualSales, previous: lastYearSales, currentPeriod: format(thisYear, 'yyyy', { locale: es }), previousPeriod: format(lastYear, 'yyyy', { locale: es }) },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cardConfig.map((config, i) => (
        <StatCard
          key={config.title}
          title={config.title}
          icon={config.icon}
          currentValue={values[i].current}
          previousValue={values[i].previous}
          currentPeriod={values[i].currentPeriod}
          previousPeriod={values[i].previousPeriod}
          config={config}
        />
      ))}
    </div>
  );
}
