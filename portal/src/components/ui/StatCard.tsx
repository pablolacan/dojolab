import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: ReactNode;
  color?: 'green' | 'red' | 'blue' | 'yellow' | 'gray';
  onClick?: () => void;
  className?: string;
  delay?: number;
}

export const StatCard = ({
  title,
  value,
  description,
  icon,
  color = 'gray',
  onClick,
  className = '',
  delay = 0
}: StatCardProps) => {
  const getCardColor = (color: string) => {
    const colors = {
      green: "text-green-600 bg-green-50 border-green-200",
      red: "text-red-600 bg-red-50 border-red-200",
      blue: "text-blue-600 bg-blue-50 border-blue-200",
      yellow: "text-yellow-600 bg-yellow-50 border-yellow-200",
      gray: "text-gray-600 bg-gray-50 border-gray-200"
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  const getIconColor = (color: string) => {
    const colors = {
      green: "text-green-600 bg-green-100",
      red: "text-red-600 bg-red-100", 
      blue: "text-blue-600 bg-blue-100",
      yellow: "text-yellow-600 bg-yellow-100",
      gray: "text-gray-600 bg-gray-100"
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  const Component = onClick ? 'button' : 'div';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <Component
        onClick={onClick}
        className={`w-full bg-white rounded-2xl p-6 border shadow-card hover:shadow-card-hover hover-lift transition-smooth ${getCardColor(color)} ${onClick ? 'hover:scale-105' : ''}`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-2xl ${getIconColor(color)}`}>
            {icon}
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-1 text-subheading">
          {value}
        </h3>
        
        <p className="text-sm text-gray-700 mb-2 text-caption font-medium">
          {title}
        </p>
        
        {description && (
          <p className="text-xs text-gray-600 text-body">
            {description}
          </p>
        )}
      </Component>
    </motion.div>
  );
};