import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import type { Initiative } from '../../types';

interface Props {
  initiatives: Initiative[];
}

const DepartmentChart: React.FC<Props> = ({ initiatives }) => {
  const chartData = useMemo(() => {
    const deptCounts = initiatives.reduce((acc, item) => {
      if (item.ban_chu_tri) {
        acc[item.ban_chu_tri] = (acc[item.ban_chu_tri] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const sortedDepts = Object.entries(deptCounts).sort(([, a], [, b]) => a - b);
    
    return {
      labels: sortedDepts.map(([dept]) => dept),
      datasets: [{
        label: 'Số lượng sáng kiến',
        data: sortedDepts.map(([, count]) => count),
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 1
      }]
    };
  }, [initiatives]);

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  return <Bar data={chartData} options={options} />;
};

export default DepartmentChart;