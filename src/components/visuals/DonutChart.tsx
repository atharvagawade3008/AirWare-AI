import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

interface Props {
  data: DonutSlice[];
  centerValue: string;
  centerLabel: string;
  size?: number;
  unit?: string;
  /** Use light text when the chart sits on a dark panel. */
  dark?: boolean;
}

/**
 * Compact donut with an HTML legend so percentages are readable at a glance.
 * `value` must be additive (parts of a whole), never an independent index.
 */
export const DonutChart: React.FC<Props> = ({ data, centerValue, centerLabel, size = 156, unit = '', dark = false }) => {
  const visible = data.filter((d) => d.value > 0);
  const total = visible.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex w-full flex-col sm:flex-row items-center gap-3 sm:gap-4">
      <div className="relative shrink-0 aspect-square" style={{ width: size, maxWidth: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={visible}
              dataKey="value"
              nameKey="name"
              innerRadius="63%"
              outerRadius="94%"
              paddingAngle={2}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive={false}
            >
              {visible.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any, name: any) => [`${value}${unit}`, name]}
              contentStyle={{
                backgroundColor: '#1E293B',
                borderRadius: '0.75rem',
                border: 'none',
                color: '#fff',
                fontSize: '12px'
              }}
              itemStyle={{ color: '#fff' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4">
          <span className={`text-xl font-extrabold leading-none ${dark ? 'text-white' : 'text-slate-900'}`}>{centerValue}</span>
          <span className={`text-[10px] text-center mt-1 leading-tight ${dark ? 'text-emerald-100/80' : 'text-slate-500'}`}>{centerLabel}</span>
        </div>
      </div>

      <ul className="w-full space-y-1.5">
        {visible.map((slice) => (
          <li key={slice.name} className="flex items-center justify-between gap-2 text-[11px]">
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
              <span className={`truncate ${dark ? 'text-emerald-50/90' : 'text-slate-700'}`}>{slice.name}</span>
            </span>
            <span className={`font-bold shrink-0 ${dark ? 'text-white' : 'text-slate-900'}`}>
              {total > 0 ? Math.round((slice.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
