import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface InfoItem {
  id?: string | number;
  label: string;
  value: string;
  isStatus?: boolean;
  statusColor?: string;
  icon?: ReactNode;
}

interface InfoPanelProps {
  title: string;
  items: InfoItem[];
  variant?: 'default' | 'compact';
  className?: string;
  delay?: number;
}

export const InfoPanel = ({
  title,
  items,
  variant = 'default',
  className = '',
  delay = 0
}: InfoPanelProps) => {
  const getDefaultStatusColor = (value: string) => {
    const lowerValue = value.toLowerCase();
    if (lowerValue.includes('activo') || lowerValue.includes('conectado')) {
      return 'text-green-600 bg-green-100';
    }
    if (lowerValue.includes('inactivo') || lowerValue.includes('desconectado')) {
      return 'text-red-600 bg-red-100';
    }
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`bg-white rounded-2xl border border-gray-100 p-6 shadow-card ${className}`}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-6 text-subheading">
        {title}
      </h3>
      
      <div className="space-y-4">
        {items.map((item, index) => (
          <div 
            key={item.id || index} 
            className={`flex justify-between items-center p-3 bg-gray-50 rounded-2xl ${
              variant === 'compact' ? 'p-2' : 'p-3'
            }`}
          >
            <div className="flex items-center space-x-2">
              {item.icon && (
                <span className="text-gray-500">
                  {item.icon}
                </span>
              )}
              <span className="text-gray-600 text-sm text-caption">
                {item.label}:
              </span>
            </div>
            
            <span 
              className={`text-sm font-medium text-caption ${
                item.isStatus 
                  ? `${item.statusColor || getDefaultStatusColor(item.value)} px-2 py-1 rounded-full`
                  : 'text-gray-900'
              } ${index === 0 && item.label === 'API URL' ? 'text-xs' : ''}`}
            >
              {item.value}
            </span>
          </div>
        ))}
        
        {items.length === 0 && (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm text-body">
              No hay información disponible
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};