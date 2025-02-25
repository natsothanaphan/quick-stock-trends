import React from 'react';
import { Line } from 'react-chartjs-2';
import './PercentageLineChart.css';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);
const options = {
  responsive: true,
  scales: {
    x: { type: 'category' },
    y: {
      ticks: { callback: (v) => (v > 0 ? '+' : '') + v + '%' },
      title: { display: true, text: 'Trend' },
    },
  },
  elements: {
    point: {
      radius: 6,
      hitRadius: 8,
      hoverRadius: 8,
      hoverBorderWidth: 8,
    },
    line: { tension: 0.16 },
  },
  plugins: {
    legend: { position: 'bottom' },
    tooltip: { callbacks: { label: (context) => {
      const label = context.dataset.label || '';
      const y = context.parsed.y;
      const sign = y > 0 ? '+' : '';
      return `${label}: ${sign}${y.toFixed(2)}%`;
    }}},
  },
};

const PercentageLineChart = ({ chartData, title }) => {
  return (
    <div className='chart-container'>
      <h3>{title}</h3>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default PercentageLineChart;
