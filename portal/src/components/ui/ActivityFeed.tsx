import { motion } from 'framer-motion';

interface ActivityItem {
  id?: string | number;
  action: string;
  description: string;
  time: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  title?: string;
  maxItems?: number;
  className?: string;
}

export const ActivityFeed = ({
  activities,
  title = "Actividad Reciente",
  maxItems,
  className = ''
}: ActivityFeedProps) => {
  const displayedActivities = maxItems ? activities.slice(0, maxItems) : activities;

  const getTypeColor = (type: string) => {
    const colors = {
      success: 'bg-green-500',
      info: 'bg-blue-500', 
      warning: 'bg-yellow-500',
      error: 'bg-red-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`bg-white rounded-2xl border border-gray-100 p-6 shadow-card ${className}`}
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-6 text-subheading">
        {title}
      </h2>
      
      <div className="space-y-4">
        {displayedActivities.map((activity, index) => (
          <div 
            key={activity.id || index} 
            className="flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all duration-200"
          >
            <div className={`w-3 h-3 rounded-full ${getTypeColor(activity.type)}`} />
            
            <div className="flex-1">
              <p className="text-gray-900 text-sm font-medium text-caption">
                {activity.action}
              </p>
              <p className="text-gray-600 text-xs text-body">
                {activity.description}
              </p>
            </div>
            
            <span className="text-gray-500 text-xs text-body">
              {activity.time}
            </span>
          </div>
        ))}
        
        {displayedActivities.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm text-body">
              No hay actividad reciente
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};