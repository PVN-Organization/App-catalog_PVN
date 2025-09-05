import React from 'react';
import type { StatCardProps } from '../types';

const colorClasses = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  green: { bg: 'bg-green-100', text: 'text-green-600' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
};

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, color }) => {
  const classes = colorClasses[color] || colorClasses.blue;

  // Adjust font size for long string values to prevent overflow
  const getValueClass = () => {
    if (typeof value === 'string') {
      if (value.length > 20) {
        return 'text-lg'; // Smallest size for very long text
      }
      if (value.length > 15) {
        return 'text-xl'; // Medium size for long text
      }
    }
    return 'text-3xl'; // Default size for numbers or short text
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4 transition-transform transform hover:-translate-y-1 hover:shadow-lg overflow-hidden">
      <div className={`flex-shrink-0 ${classes.bg} p-3 rounded-full`}>
        <span className={classes.text}>{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p 
          className={`${getValueClass()} font-bold text-gray-800 truncate`}
          title={typeof value === 'string' ? value : undefined}
        >
          {value}
        </p>
        <p className="text-gray-500 truncate">{label}</p>
      </div>
    </div>
  );
};

export default StatCard;
