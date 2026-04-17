import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, ShoppingCart, TrendingUp, TrendingDown, Package, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface Order {
  id: string;
  total_amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  currency: string;
}

const COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(142, 70%, 45%)",
  "hsl(45, 93%, 47%)",
  "hsl(280, 60%, 50%)",
  "hsl(0, 72%, 51%)",
];

const SalesAnalyticsWidget = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<1 | 7 | 30 | 90 | 365>(30);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const since = subDays(new Date(), range).toISOString();
      const { data } = await supabase
        .from("orders")
        .select("id, total_amount, status, payment_method, created_at, currency")
        .gte("created_at", since)
        .order("created_at", { ascending: true });
      setOrders(data || []);
      setLoading(false);
    };
    load();
  }, [range]);

  const stats = useMemo(() => {
    const completed = orders.filter((o) => o.status === "completed");
    const totalRevenue = completed.reduce((s, o) => s + Number(o.total_amount), 0);
    const totalOrders = orders.length;
    const completedOrders = completed.length;
    const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;
    const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "processing").length;

    // Compare to previous period
    const halfPoint = Math.floor(orders.length / 2);
    const firstHalf = completed.slice(0, Math.floor(completedOrders / 2));
    const secondHalf = completed.slice(Math.floor(completedOrders / 2));
    const firstRev = firstHalf.reduce((s, o) => s + Number(o.total_amount), 0);
    const secondRev = secondHalf.reduce((s, o) => s + Number(o.total_amount), 0);
    const trend = firstRev > 0 ? ((secondRev - firstRev) / firstRev) * 100 : 0;

    return { totalRevenue, totalOrders, completedOrders, avgOrderValue, pendingOrders, trend };
  }, [orders]);

  // Daily revenue chart data
  const revenueChartData = useMemo(() => {
    const days: Record<string, { date: string; revenue: number; orders: number }> = {};
    for (let i = range - 1; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "MMM dd");
      days[d] = { date: d, revenue: 0, orders: 0 };
    }
    orders
      .filter((o) => o.status === "completed")
      .forEach((o) => {
        const d = format(new Date(o.created_at), "MMM dd");
        if (days[d]) {
          days[d].revenue += Number(o.total_amount);
          days[d].orders += 1;
        }
      });
    return Object.values(days);
  }, [orders, range]);

  // Status breakdown
  const statusData = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach((o) => {
      map[o.status] = (map[o.status] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [orders]);

  // Payment method breakdown
  const paymentData = useMemo(() => {
    const map: Record<string, number> = {};
    orders
      .filter((o) => o.status === "completed")
      .forEach((o) => {
        const label = o.payment_method.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        map[label] = (map[label] || 0) + Number(o.total_amount);
      });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const metricCards = [
    {
      label: "Total Revenue",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "bg-primary/10 text-primary",
      sub: `${stats.completedOrders} completed`,
    },
    {
      label: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "bg-[hsl(142,70%,45%)]/10 text-[hsl(142,70%,45%)]",
      sub: `${stats.pendingOrders} pending`,
    },
    {
      label: "Avg. Order Value",
      value: `$${stats.avgOrderValue.toFixed(2)}`,
      icon: CreditCard,
      color: "bg-[hsl(280,60%,50%)]/10 text-[hsl(280,60%,50%)]",
      sub: "per completed order",
    },
    {
      label: "Revenue Trend",
      value: `${stats.trend >= 0 ? "+" : ""}${stats.trend.toFixed(1)}%`,
      icon: stats.trend >= 0 ? TrendingUp : TrendingDown,
      color: stats.trend >= 0
        ? "bg-[hsl(142,70%,45%)]/10 text-[hsl(142,70%,45%)]"
        : "bg-destructive/10 text-destructive",
      sub: "vs previous half",
    },
  ];

  const rangeOptions: { label: string; value: 1 | 7 | 30 | 90 | 365 }[] = [
    { label: "Today", value: 1 },
    { label: "7 days", value: 7 },
    { label: "30 days", value: 30 },
    { label: "90 days", value: 90 },
    { label: "Yearly", value: 365 },
  ];

  return (
    <div className="space-y-6">
      {/* Header with range selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Package className="w-5 h-5 text-muted-foreground" />
          Sales & Analytics
        </h3>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {rangeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-md font-medium transition-colors",
                range === opt.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, i) => (
          <div key={i} className="bg-background rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">{card.label}</span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Over Time - 2 cols */}
        <div className="lg:col-span-2 bg-background rounded-xl border border-border p-6">
          <h4 className="text-sm font-semibold text-foreground mb-4">Revenue Over Time</h4>
          {loading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  interval={range <= 7 ? 0 : range <= 30 ? 4 : 10}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(217, 91%, 60%)"
                  strokeWidth={2}
                  fill="url(#revGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-background rounded-xl border border-border p-6">
          <h4 className="text-sm font-semibold text-foreground mb-4">Order Status</h4>
          {loading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : statusData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-16">No orders yet</p>
          ) : (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {statusData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-muted-foreground capitalize">{entry.name}</span>
                    <span className="font-medium text-foreground">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Second row: Orders per day + Payment methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders per day */}
        <div className="bg-background rounded-xl border border-border p-6">
          <h4 className="text-sm font-semibold text-foreground mb-4">Completed Orders Per Day</h4>
          {loading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  interval={range <= 7 ? 0 : range <= 30 ? 4 : 10}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="orders" fill="hsl(142, 70%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Payment Method Revenue */}
        <div className="bg-background rounded-xl border border-border p-6">
          <h4 className="text-sm font-semibold text-foreground mb-4">Revenue by Payment Method</h4>
          {loading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : paymentData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-16">No completed orders yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={paymentData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => `$${v}`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                />
                <Bar dataKey="value" fill="hsl(280, 60%, 50%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesAnalyticsWidget;
