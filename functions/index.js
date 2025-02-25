require('dotenv').config({ path: ['.env', '.env.default'] });
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { setGlobalOptions } = require('firebase-functions/v2');
const { onRequest } = require('firebase-functions/v2/https');
const logger = require('firebase-functions/logger');
const express = require('express');
const { getTiingoHistoricalData } = require('./tiingo.js');

setGlobalOptions({ region: 'asia-southeast1' });
initializeApp();

const app = express();
app.use(express.json());

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    req.uid = decodedToken.uid;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
app.use(authenticate);

app.get('/api/ping', (req, res) => {
  res.send('pong');
});

app.get('/api/getHistoricalData', async (req, res) => {
  try {
    const { symbols, startDate } = req.query;
    if (!symbols || !startDate) return res.status(400).json({ error: 'Missing symbols or startDate parameter' });

    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return res.status(400).json({ error: 'startDate must be in yyyy-mm-dd format' });
    const inputDate = new Date(startDate);
    if (isNaN(inputDate.getTime())) return res.status(400).json({ error: 'Invalid startDate' });
    const currentDate = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(currentDate.getFullYear() - 1);
    if (inputDate < oneYearAgo) return res.status(400).json({ error: 'startDate must be within the past 1 year' });

    const rawSymbols = symbols.toUpperCase().split(',').map((s) => s.trim()).filter((s) => s.length > 0);
    const dedupedSymbols = [...new Set(rawSymbols)];
    rawSymbols.length = 0;
    rawSymbols.push(...dedupedSymbols);
    if (rawSymbols.length > 10) return res.status(400).json({ error: 'More than 10 symbols are not allowed' });

    const symbolList = [];
    for (const rawSym of rawSymbols) {
      const parts = rawSym.split(':');
      if (parts.length !== 2) return res.status(400).json({ error: `Invalid symbol format: ${rawSym}` });
      if (parts[0] !== 'NASDAQ') return res.status(400).json({ error: `Market ${parts[0]} not supported. Only NASDAQ symbols are allowed` });
      symbolList.push({raw: rawSym, market: parts[0], symbol: parts[1]});
    }

    const results = await Promise.all(symbolList.map(({raw, market, symbol}) => 
      getTiingoHistoricalData(symbol, startDate)
        .then((data) => ({ raw, market, symbol, data }))
        .catch((error) => ({ raw, market, symbol, error: error.message }))
    ));

    const responseData = {};
    results.forEach((item) => {
      responseData[item.raw] = item;
    });
    return res.json(responseData);
  } catch (error) {
    logger.error('Error in getHistoricalData:', error);
    return res.status(500).json({ error: error.message });
  }
});

exports.app = onRequest(app);
