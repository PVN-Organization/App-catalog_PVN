import React, { useMemo } from 'react';
import { Pie } from 'react-chartjs-2';
import type { Initiative } from '../../types';

interface Props {
  initiatives: Initiative[];
}

const ClassificationChart: React.FC<Props> = ({ initiatives }) => {
  const chartData = useMemo(() => {
    const classificationCounts = initiatives.reduce((acc, item) => {
      const classification = item.phan_loai || "Chưa xác định";
      acc[classification] = (acc[classification] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: Object.keys(classificationCounts),
      datasets: [{
        data: Object.values(classificationCounts),
        backgroundColor: ['rgba(239, 68, 68, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(249, 115, 22, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(99, 102, 241, 0.8)'],
        borderColor: '#ffffff',
        borderWidth: 4,
      }]
    };
  }, [initiatives]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { padding: 15, usePointStyle: true, pointStyle: 'rectRounded' } },
    }
  };

  return <Pie data={chartData} options={options} />;
};

export default ClassificationChart;