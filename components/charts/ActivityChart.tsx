import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';

interface Props {
  activityData: { [date: string]: number };
}

const ActivityChart: React.FC<Props> = ({ activityData }) => {
  const chartData = useMemo(() => {
    const labels: string[] = [];
    const dataPoints: number[] = [];
    
    // Generate labels for the last 30 days
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        labels.push(d.toISOString().split('T')[0]);
    }
    
    labels.forEach(date => {
        dataPoints.push(activityData[date] || 0);
    });

    return {
      labels: labels.map(l => new Date(l).toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' })), // Format for display
      datasets: [{
        label: 'User Actions',
        data: dataPoints,
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.6,
      }]
    };
  }, [activityData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
            label: function(context: any) {
                let label = context.dataset.label || '';
                if (label) {
                    label += ': ';
                }
                if (context.parsed.y !== null) {
                    label += context.parsed.y;
                }
                return label;
            }
        }
      }
    },
    scales: {
      x: {
        grid: {
            display: false,
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 10,
        }
      }
    }
  };

  return <Bar data={chartData} options={options} />;
};

export default ActivityChart;