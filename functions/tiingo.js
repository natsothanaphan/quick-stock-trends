const logger = require('firebase-functions/logger');
const fetch = require('node-fetch');

const TOKEN = process.env.TIINGO_API_TOKEN;
if (!TOKEN) throw new Error('TIINGO_API_TOKEN environment variable not set');

// Rate limit: 50 req/hour, 1000 req/day, bandwidth 2 gb/month
const getTiingoHistoricalData = async (symbol, startDate) => {
  const url = `https://api.tiingo.com/tiingo/daily/${symbol}/prices?startDate=${startDate}&token=${TOKEN}`;
  logger.info('Fetching data from Tiingo', url);
  const resp = await fetch(url);

  if (!resp.ok) throw new Error(`Failed to fetch data from Tiingo for symbol ${symbol}`);

  const data = await resp.json();
  logger.info('Fetched data from Tiingo', data);
  
  if (!Array.isArray(data) || data.length === 0) throw new Error(`No data returned from Tiingo for symbol ${symbol}`);
  
  const cleanedData = data.map((entry) => {
    return {
      date: entry.date.slice(0, 10),
      open: entry.open,
      high: entry.high,
      low: entry.low,
      close: entry.close,
      volume: entry.volume,
    };
  });
  return cleanedData;
};

module.exports = { getTiingoHistoricalData };
