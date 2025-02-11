function getRandomColor() {
  const r = Math.floor(Math.random() * 200);
  const g = Math.floor(Math.random() * 200);
  const b = Math.floor(Math.random() * 200);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Fetches historical stock data and returns the formatted datasets
 * for closing price and volume percentage changes.
 *
 * @param {string} symbols - Comma separated stock symbols.
 * @param {string} startDate - The start date in YYYY-MM-DD format.
 * @returns {Promise<{closeChartData: object, volumeChartData: object}>}
 */
export async function fetchHistoricalData(symbols, startDate) {
  const queryParams = new URLSearchParams({ symbols, startDate });
  const response = await fetch(`/api/getHistoricalData?${queryParams.toString()}`);
  const data = await response.json();
  console.log(data);
  if (!response.ok) {
    throw new Error(data.error || "An error occurred.");
  }

  const closeDatasets = [];
  const volumeDatasets = [];

  for (const key in data) {
    const symbolData = data[key];

    // Skip any symbol entry with an error
    if (symbolData.error) continue;

    let ohlcv = symbolData.data;
    if (!Array.isArray(ohlcv) || ohlcv.length === 0) continue;

    // Sort by date (assuming date in "YYYY-MM-DD" format)
    ohlcv.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Get baseline values from the first data point
    const baselineClose = ohlcv[0].close;
    const baselineVolume = ohlcv[0].volume;
    if (!baselineClose || !baselineVolume) continue;

    // Compute percentage differences (first day will be 0%)
    const closePoints = ohlcv.map(item => ({
      x: item.date,
      y: (((item.close - baselineClose) / baselineClose) * 100).toFixed(2)
    }));

    const volumePoints = ohlcv.map(item => ({
      x: item.date,
      y: (((item.volume - baselineVolume) / baselineVolume) * 100).toFixed(2)
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

  return {
    closeChartData: { datasets: closeDatasets },
    volumeChartData: { datasets: volumeDatasets },
  };
}
