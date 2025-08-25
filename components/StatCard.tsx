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

  return (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4 transition-transform transform hover:-translate-y-1 hover:shadow-lg">
      <div className={`${classes.bg} p-3 rounded-full`}>
        <span className={classes.text}>{icon}</span>
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
        <p className="text-gray-500">{label}</p>
      </div>
    </div>
  );
};

export default StatCard;
