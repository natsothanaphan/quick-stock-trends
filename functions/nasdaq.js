const logger = require("firebase-functions/logger");

// Helper to parse price fields (removes "$" and converts to float)
const parsePrice = (str) => {
  if (!str) return null;
  const price = parseFloat(str.replace('$',''));
  if (isNaN(price)) return null;
  return price;
};

// Helper to parse volume strings (removes commas and converts to integer)
const parseVolume = (str) => {
  if (!str) return null;
  const volume = parseInt(str.replace(/,/g, ''), 10);
  if (isNaN(volume)) return null;
  return volume;
};

async function getNasdaqHistoricalData(symbol, startDate) {
  // Construct the Nasdaq API URL for the given symbol and startDate
  const url = `https://api.nasdaq.com/api/quote/${symbol}/historical?assetclass=stocks&fromdate=${startDate}&limit=400`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json, text/plain, */*'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch data for symbol ${symbol}`);
  }
  
  const json = await response.json();
  logger.info(json);

  // Ensure the expected data structure exists
  if (!json.data || !json.data.tradesTable || !json.data.tradesTable.rows) {
    throw new Error(`Invalid data format received for symbol ${symbol}`);
  }
  
  // Clean and transform each OHLCV row
  const cleanedData = json.data.tradesTable.rows.map(row => {
    // Convert date from "MM/DD/YYYY" to "YYYY-MM-DD"
    const parts = row.date.split('/');
    let formattedDate = "";
    if (parts.length === 3) {
      formattedDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
    } else {
      formattedDate = row.date; // fallback if format is unexpected
    }
  
    return {
      date: formattedDate,
      open: parsePrice(row.open),
      high: parsePrice(row.high),
      low: parsePrice(row.low),
      close: parsePrice(row.close),
      volume: parseVolume(row.volume)
    };
  });
  
  return cleanedData;
}

module.exports = {
  getNasdaqHistoricalData,
};
