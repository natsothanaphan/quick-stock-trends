const { setGlobalOptions } = require("firebase-functions/v2");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { getNasdaqHistoricalData } = require("./nasdaq");

setGlobalOptions({ region: 'asia-southeast1' });

// New endpoint to fetch historical OHLCV data from Nasdaq API
exports.getHistoricalData = onRequest(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).send('');
  }

  try {
    // Extract symbols and startDate from query parameters
    const { symbols, startDate } = req.query;
    if (!symbols || !startDate) {
      return res.status(400).json({ error: 'Missing symbols or startDate parameter' });
    }

    // Validate startDate format yyyy-mm-dd
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      return res.status(400).json({ error: 'startDate must be in yyyy-mm-dd format' });
    }

    const inputDate = new Date(startDate);
    if (isNaN(inputDate.getTime())) {
      return res.status(400).json({ error: 'Invalid startDate' });
    }
    const currentDate = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(currentDate.getFullYear() - 1);
    if (inputDate < oneYearAgo) {
      return res.status(400).json({ error: 'startDate must be within the past 1 year' });
    }

    // Validate and parse symbols. Each symbol must be in the format "NASDAQ:<symbol>"
    const rawSymbols = symbols.toUpperCase().split(",").map(s => s.trim()).filter(s => s.length > 0);
    const dedupedSymbols = Array.from(new Set(rawSymbols));
    rawSymbols.length = 0;
    rawSymbols.push(...dedupedSymbols);

    // Deny if more than 10 symbols
    if (rawSymbols.length > 10) {
      return res.status(400).json({ error: 'More than 10 symbols are not allowed' });
    }

    const symbolList = [];
    for (const rawSym of rawSymbols) {
      const parts = rawSym.split(':');
      if (parts.length !== 2) {
        return res.status(400).json({ error: `Invalid symbol format: ${rawSym}` });
      }
      if (parts[0] !== "NASDAQ") {
        return res.status(400).json({ error: `Market ${parts[0]} not supported. Only NASDAQ symbols are allowed` });
      }
      symbolList.push({raw: rawSym, market: parts[0], symbol: parts[1]});
    }

    // Fetch data for all symbols concurrently using the NASDAQ module
    const results = await Promise.all(symbolList.map(({raw, market, symbol}) => 
      getNasdaqHistoricalData(symbol, startDate)
        .then(data => ({ raw, market, symbol, data }))
        .catch(error => ({ raw, market, symbol, error: error.message }))
    ));

    // Construct and send the response object
    const responseData = {};
    results.forEach(item => {
      responseData[item.raw] = item;
    });

    return res.json(responseData);
  } catch (error) {
    logger.error("Error in getHistoricalData:", error);
    return res.status(500).json({ error: error.message });
  }
});
