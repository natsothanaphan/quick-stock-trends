import React, { useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './App.css';

// Register the necessary Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Helper to generate a random color for chart lines
function getRandomColor() {
  const r = Math.floor(Math.random() * 200);
  const g = Math.floor(Math.random() * 200);
  const b = Math.floor(Math.random() * 200);
  return `rgb(${r}, ${g}, ${b})`;
}

function App() {
  const [symbolsInput, setSymbolsInput] = useState("");
  const [startDate, setStartDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [closeChartData, setCloseChartData] = useState(null);
  const [volumeChartData, setVolumeChartData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);
    setCloseChartData(null);
    setVolumeChartData(null);

    if (!symbolsInput || !startDate) {
      setApiError("Please enter both symbols and a start date.");
      return;
    }

    setLoading(true);
    try {
      // Construct query parameters
      const queryParams = new URLSearchParams({
        symbols: symbolsInput,
        startDate: startDate,
      });
      const response = await fetch(`/getHistoricalData?${queryParams.toString()}`);
      const data = await response.json();

      if (response.ok) {
        // Process the received data to create chart datasets
        const closeDatasets = [];
        const volumeDatasets = [];

        // Iterate over each symbol response
        for (const key in data) {
          const symbolData = data[key];

          // Skip if there is an error with that symbol
          if (symbolData.error) continue;

          let ohlcv = symbolData.data;
          if (!Array.isArray(ohlcv) || ohlcv.length === 0) continue;

          // Sort by date (assumes date in "YYYY-MM-DD" format)
          ohlcv.sort((a, b) => new Date(a.date) - new Date(b.date));

          // Get baseline values from the first data point
          const baselineClose = ohlcv[0].close;
          const baselineVolume = ohlcv[0].volume;
          if (!baselineClose || !baselineVolume) continue;

          // Compute percentage differences (first day will be 0%)
          const closePoints = ohlcv.map(item => ({
            x: item.date,
            y: ((item.close - baselineClose) / baselineClose * 100).toFixed(2)
          }));

          const volumePoints = ohlcv.map(item => ({
            x: item.date,
            y: ((item.volume - baselineVolume) / baselineVolume * 100).toFixed(2)
          }));

          const color = getRandomColor();

          closeDatasets.push({
            label: key,
            data: closePoints,
            borderColor: color,
            backgroundColor: color,
            fill: false,
            tension: 0.2,
          });

          volumeDatasets.push({
            label: key,
            data: volumePoints,
            borderColor: color,
            backgroundColor: color,
            fill: false,
            tension: 0.2,
          });
        }

        // Create the chart data objects; the x-axis will be rendered as category labels
        setCloseChartData({
          datasets: closeDatasets
        });
        setVolumeChartData({
          datasets: volumeDatasets
        });
      } else {
        setApiError(data.error || "An error occurred.");
      }
    } catch (err) {
      console.error(err);
      setApiError(err.message || "An error occurred while fetching data.");
    }
    setLoading(false);
  };

  // Common chart options using a category scale for x-axis (dates)
  const chartOptions = {
    responsive: true,
    scales: {
      x: {
        type: 'category',
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Percentage Difference (%)'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
      },
    },
  };

  return (
    <div className="App">
      <h1>Quick Stock Trends</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Symbols: </label>
          <input
            type="text"
            value={symbolsInput}
            onChange={(e) => setSymbolsInput(e.target.value)}
            placeholder="NASDAQ:AAPL, NASDAQ:META"
          />
        </div>
        <div>
          <label>Start Date: </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
       <div>
          <button type="submit" disabled={loading}>
            {loading ? "Loading..." : "Submit"}
          </button>
        </div>
      </form>
      {apiError && <div className="error">{apiError}</div>}
      <div className="charts">
        {closeChartData && (
          <div className="chart-container">
            <h2>Closing Price Percentage Change</h2>
            <Line 
              data={closeChartData} 
              options={{
                ...chartOptions,
                plugins: { 
                  ...chartOptions.plugins, 
                  title: { display: true, text: 'Closing Price % Change' }
                }
              }} 
            />
          </div>
        )}
        {volumeChartData && (
          <div className="chart-container">
            <h2>Volume Percentage Change</h2>
            <Line 
              data={volumeChartData} 
              options={{
                ...chartOptions,
                plugins: { 
                  ...chartOptions.plugins, 
                  title: { display: true, text: 'Volume % Change' }
                }
              }} 
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
