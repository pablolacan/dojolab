import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface QuickAction {
  id?: string | number;
  label: string;
  icon: ReactNode;
  color?: string;
  onClick?: () => void;
  disabled?: boolean;
}

interface QuickActionsProps {
  actions: QuickAction[];
  title?: string;
  className?: string;
}

export const QuickActions = ({
  actions,
  title = "Acciones Rápidas",
  className = ''
}: QuickActionsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className={`bg-white rounded-2xl border border-gray-100 p-6 shadow-card ${className}`}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-6 text-subheading">
        {title}
      </h3>
      
      <div className="space-y-3">
        {actions.map((action, index) => (
          <button
            key={action.id || index}
            onClick={action.onClick}
            disabled={action.disabled}
            className={`w-full flex items-center space-x-3 p-3 rounded-2xl transition-all duration-200 ${
              action.color || "bg-gray-50 text-gray-600 hover:bg-gray-100"
            } ${
              action.disabled 
                ? "opacity-50 cursor-not-allowed" 
                : "hover:text-gray-900"
            }`}
          >
            {action.icon}
            <span className="text-sm font-medium text-caption">
              {action.label}
            </span>
          </button>
        ))}
        
        {actions.length === 0 && (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm text-body">
              No hay acciones disponibles
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};