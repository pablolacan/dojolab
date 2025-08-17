import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface StatItem {
  id?: string | number;
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'gray';
  onClick?: () => void;
}

interface StatsGridProps {
  stats: StatItem[];
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  delay?: number;
}

export const StatsGrid = ({
  stats,
  columns = 4,
  className = '',
  delay = 0.1
}: StatsGridProps) => {
  const getGridColumns = (cols: number) => {
    const gridStyles: Record<number, string> = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-4',
      5: 'grid-cols-1 md:grid-cols-5',
      6: 'grid-cols-1 md:grid-cols-6'
    };
    return gridStyles[cols] || gridStyles[4];
  };

  const getColorStyles = (color?: string) => {
    const colors = {
      blue: 'border-blue-100',
      green: 'border-green-100',
      yellow: 'border-yellow-100',
      purple: 'border-purple-100',
      red: 'border-red-100',
      gray: 'border-gray-100'
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`grid ${getGridColumns(columns)} gap-4 ${className}`}
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.id || index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: delay + index * 0.05 }}
          className={`${stat.onClick ? 'cursor-pointer' : ''}`}
          onClick={stat.onClick}
        >
          <div className={`bg-white rounded-2xl border p-4 shadow-card hover:shadow-card-hover hover-lift transition-smooth ${getColorStyles(stat.color)}`}>
            <div className="flex items-center justify-between mb-3">
              {stat.icon && (
                <div className="text-gray-600">
                  {stat.icon}
                </div>
              )}
              <div className="text-right flex-1">
                <p className="text-2xl font-bold text-gray-900 text-subheading">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-600 text-caption">
                  {stat.label}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};