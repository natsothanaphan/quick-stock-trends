// symbol -> { startDate, rawData }
const CACHE = {};

const fetchHistoricalData = async (token, symbols, requestedStartDate) => {
  const _symbolsArr = symbols.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
  const symbolsArr = [...new Set(_symbolsArr)];

  console.log('Cache state before fetching:', Object.keys(CACHE).map((symbol) =>
    ({ symbol, startDate: CACHE[symbol]?.startDate || 'N/A' })));

  const symbolsToFetch = [];
  const cachedResults = {};
  for (const symbol of symbolsArr) {
    if (CACHE[symbol] && CACHE[symbol].startDate <= requestedStartDate) {
      cachedResults[symbol] = CACHE[symbol].rawData;
    } else {
      symbolsToFetch.push(symbol);
    }
  }

  let fetchedResults = {};
  if (symbolsToFetch.length === 0) {
    console.log('Not fetching any symbols as they are all cached.');
  } else {
    const querySymbols = symbolsToFetch.join(',');
    console.log('Get historical data for symbols and start date:', querySymbols, requestedStartDate);
    const queryParams = new URLSearchParams({ symbols: querySymbols, startDate: requestedStartDate });
    const resp = await fetch(`/api/getHistoricalData?${queryParams.toString()}`,
      { headers: { Authorization: `Bearer ${token}` } });
    const data = await resp.json();
    console.log('Historical data:', data);

    if (!resp.ok) throw new Error(data.error || 'An error occurred while fetching data.');

    for (const symbol of symbolsToFetch) {
      if (data[symbol] && !data[symbol].error && Array.isArray(data[symbol].data)) {
        fetchedResults[symbol] = data[symbol].data;
        CACHE[symbol] = { startDate: requestedStartDate, rawData: data[symbol].data };
      }
    }
  }

  console.log('Cache state after fetching:', Object.keys(CACHE).map((symbol) =>
    ({ symbol, startDate: CACHE[symbol]?.startDate || 'N/A' })));

  const combinedResults = {};
  for (const symbol of symbolsArr) {
    if (cachedResults[symbol]) combinedResults[symbol] = cachedResults[symbol];
    else if (fetchedResults[symbol]) combinedResults[symbol] = fetchedResults[symbol];
  }

  const closeDatasets = [];
  const volumeDatasets = [];
  for (const symbol in combinedResults) {
    const ohlcv = combinedResults[symbol];

    const filteredOHLCV = ohlcv.filter((item) => item.date >= requestedStartDate);
    if (filteredOHLCV.length === 0) continue;
    filteredOHLCV.sort((a, b) => new Date(a.date) - new Date(b.date));

    const baselineClose = filteredOHLCV[0].close;
    const baselineVolume = filteredOHLCV[0].volume;
    if (!baselineClose || !baselineVolume) continue;
    const closePoints = filteredOHLCV.map((item) =>
      ({ x: item.date, y: (((item.close - baselineClose) / baselineClose) * 100).toFixed(2) }));
    const volumePoints = filteredOHLCV.map((item) =>
      ({ x: item.date, y: (((item.volume - baselineVolume) / baselineVolume) * 100).toFixed(2) }));

    closeDatasets.push({ label: symbol, data: closePoints });
    volumeDatasets.push({ label: symbol, data: volumePoints });
  }

  return {
    closeChartData: { datasets: closeDatasets },
    volumeChartData: { datasets: volumeDatasets },
  };
};

export default { fetchHistoricalData };
