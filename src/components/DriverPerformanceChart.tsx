import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DriverPerformanceChartProps {
  driverPerformance: {
    driverId: string;
    driverName: string;
    totalGross: number;
    driverType: 'company_driver' | 'owner_operator';
  }[];
}

export function DriverPerformanceChart({ driverPerformance }: DriverPerformanceChartProps) {
  const data = driverPerformance.map((driver) => ({
    name: driver.driverName.split(' ')[0],
    fullName: driver.driverName,
    gross: driver.totalGross,
    type: driver.driverType,
  }));

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
        Driver Weekly Gross Performance
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              className="text-muted-foreground"
            />
            <Tooltip
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Gross']}
              labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="gross" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.type === 'owner_operator' ? 'hsl(var(--partial))' : 'hsl(var(--revenue))'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-6 mt-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-revenue" />
          <span className="text-muted-foreground">Company Driver</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-partial" />
          <span className="text-muted-foreground">Owner Operator</span>
        </div>
      </div>
    </div>
  );
}
