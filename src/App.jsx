import React, { useState } from "react";
import PercentageLineChart from "./components/PercentageLineChart";
import { fetchHistoricalData } from "./api";
import "./App.css";

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
      const result = await fetchHistoricalData(symbolsInput, startDate);
      setCloseChartData(result.closeChartData);
      setVolumeChartData(result.volumeChartData);
    } catch (err) {
      console.error(err);
      setApiError(err.message || "An error occurred while fetching data.");
    }
    setLoading(false);
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
          <PercentageLineChart
            chartData={closeChartData}
            title="Closing Price"
          />
        )}
        {volumeChartData && (
          <PercentageLineChart
            chartData={volumeChartData}
            title="Volume"
          />
        )}
      </div>
    </div>
  );
}

export default App;
