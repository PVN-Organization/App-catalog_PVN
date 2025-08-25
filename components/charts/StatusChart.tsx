import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import type { Initiative } from '../../types';

interface Props {
  initiatives: Initiative[];
}

const StatusChart: React.FC<Props> = ({ initiatives }) => {
  const chartData = useMemo(() => {
    const statusCounts = initiatives.reduce((acc, item) => {
      const status = item.giaiDoan || "Chưa xác định";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: Object.keys(statusCounts),
      datasets: [{
        data: Object.values(statusCounts),
        backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(234, 179, 8, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(147, 51, 234, 0.8)', 'rgba(107, 114, 128, 0.8)'],
        borderColor: '#ffffff',
        borderWidth: 4
      }]
    };
  }, [initiatives]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { padding: 15, usePointStyle: true, pointStyle: 'rectRounded' } },
    },
    cutout: '60%',
  };

  return <Doughnut data={chartData} options={options} />;
};

export default StatusChart;
