const logger = require("firebase-functions/logger");
const fetch = require("node-fetch");

const TOKEN = process.env.TIINGO_API_TOKEN;
if (!TOKEN) {
  throw new Error("TIINGO_API_TOKEN environment variable not set");
}

// Rate limit 50 req/hour, 1000 req/day, bandwidth 2 gb/month
async function getTiingoHistoricalData(symbol, startDate) {
  // Construct the Tiingo API URL for the given symbol and startDate.
  // Example: https://api.tiingo.com/tiingo/daily/AAPL/prices?startDate=2025-01-02&token=<token>
  const url = `https://api.tiingo.com/tiingo/daily/${symbol}/prices?startDate=${startDate}&token=${TOKEN}`;
  
  logger.info("Fetching data from Tiingo", url);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch data from Tiingo for symbol ${symbol}`);
  }

  const data = await response.json();
  logger.info(data);
  
  // Data is expected to be an array. If the array is empty, handle it.
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`No data returned from Tiingo for symbol ${symbol}`);
  }
  
  // Standardize the result shape to match our expected format.
  const cleanedData = data.map(entry => {
    // The date is in ISO format, so we take just the first 10 characters for YYYY-MM-DD.
    const formattedDate = entry.date.slice(0, 10);
    return {
      date: formattedDate,
      open: entry.open,
      high: entry.high,
      low: entry.low,
      close: entry.close,
      volume: entry.volume
    };
  });
  return cleanedData;
}

module.exports = {
  getTiingoHistoricalData,
};
