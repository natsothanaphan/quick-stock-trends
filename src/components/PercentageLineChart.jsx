import React from "react";
import { Line } from "react-chartjs-2";
import "./PercentageLineChart.css";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const options = {
  responsive: true,
  scales: {
    x: {
      type: "category",
    },
    y: {
      ticks: {
        callback: function(value) {
          return value + "%";
        }
      },
      title: {
        display: true,
        text: "Trend (%)",
      },
    },
  },
  plugins: {
    legend: {
      position: "bottom",
    },
  },
};

function PercentageLineChart({ chartData, title }) {
  return (
    <div className="chart-container">
      <h2>{title}</h2>
      <Line data={chartData} options={options} />
    </div>
  );
}

export default PercentageLineChart;
