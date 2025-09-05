import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import type { LogEntry } from '../../types';

interface Props {
  logs: LogEntry[];
}

const LogLevelChart: React.FC<Props> = ({ logs }) => {
  const chartData = useMemo(() => {
    const levelCounts = logs.reduce((acc, item) => {
      const level = item.level || "UNKNOWN";
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const labels = Object.keys(levelCounts);
    const data = Object.values(levelCounts);

    const backgroundColors: Record<string, string> = {
        ERROR: 'rgba(239, 68, 68, 0.8)',
        WARN: 'rgba(234, 179, 8, 0.8)',
        INFO: 'rgba(59, 130, 246, 0.8)',
        DEBUG: 'rgba(107, 114, 128, 0.8)',
        UNKNOWN: 'rgba(156, 163, 175, 0.8)'
    };
    
    return {
      labels,
      datasets: [{
        data,
        backgroundColor: labels.map(label => backgroundColors[label] || backgroundColors.UNKNOWN),
        borderColor: '#ffffff',
        borderWidth: 4
      }]
    };
  }, [logs]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'bottom' as const, 
        labels: { 
            padding: 15, 
            usePointStyle: true, 
            pointStyle: 'rectRounded' 
        } 
      },
    },
    cutout: '60%',
  };

  return <Doughnut data={chartData} options={options} />;
};

export default LogLevelChart;