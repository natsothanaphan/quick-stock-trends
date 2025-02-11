// In-memory cache object.
// For each symbol, we store an object { startDate, rawData }.
// The "startDate" is the earliest date fetched in the cache.
// We assume dates are in "YYYY-MM-DD" format so that lexicographical comparison works.
const CACHE = {};

const IS_CACHE_API = import.meta.env.VITE_IS_CACHE_API.toLowerCase() === 'true';
console.log('IS_CACHE_API:', IS_CACHE_API);

/**
 * Fetches historical data with caching functionality.
 * For each symbol, if the cached data (fetched with a startDate) already covers
 * the requested period (i.e. cachedStartDate is less than or equal to requestedStartDate),
 * then it will re-use the cached raw data.
 * Otherwise, it will call the API to fetch updated data.
 *
 * @param {string} symbols - Comma separated stock symbols.
 * @param {string} requestedStartDate - The start date in YYYY-MM-DD format.
 * @returns {Promise<{closeChartData: object, volumeChartData: object}>}
 */
export async function fetchHistoricalData(symbols, requestedStartDate) {
  // Split the symbols string into an array and trim any extra spaces.
  const _symbolsArr = symbols
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  const symbolsArr = Array.from(new Set(_symbolsArr));

  // Prepare list of symbols that require API fetching.
  const symbolsToFetch = [];
  // Store data from cache that is valid for the requested period.
  const cachedResults = {};

  console.log('Cache state before fetching:', Object.keys(CACHE).map(symbol => (
    { symbol, startDate: CACHE[symbol] ? CACHE[symbol].startDate : 'N/A' })));

  for (const symbol of symbolsArr) {
    // If the symbol exists in cache and the cached startDate is earlier than,
    // or the same as the requestedStartDate, we consider it to already cover the period.
    if (CACHE[symbol] && CACHE[symbol].startDate <= requestedStartDate) {
      cachedResults[symbol] = CACHE[symbol].rawData;
    } else {
      // Either not in cache or cache does not cover (cached startDate is later) – so we fetch.
      symbolsToFetch.push(symbol);
    }
  }

  // Object to store freshly fetched raw data for symbols.
  let fetchedResults = {};

  if (symbolsToFetch.length === 0) {
    console.log('Not fetching any symbols as they are all cached.');
  }
  if (symbolsToFetch.length > 0) {
    const querySymbols = symbolsToFetch.join(",");
    console.log('Get historical data for symbols and start date:', querySymbols, requestedStartDate);
    const queryParams = new URLSearchParams({ symbols: querySymbols, startDate: requestedStartDate });
    const response = await fetch(`/api/getHistoricalData?${queryParams.toString()}`);
    const data = await response.json();
    console.log('Historical data:', data);

    // If the API response is not okay, throw an error.
    if (!response.ok) {
      throw new Error(data.error || "An error occurred while fetching data.");
    }

    // For each symbol we requested, if there's valid data, update our fetched results and cache.
    for (const symbol of symbolsToFetch) {
      if (data[symbol] && !data[symbol].error && Array.isArray(data[symbol].data)) {
        // Store raw data for later transformation.
        fetchedResults[symbol] = data[symbol].data;

        if (IS_CACHE_API) {
          // Update the cache with the new start date and raw data.
          CACHE[symbol] = {
            startDate: requestedStartDate,
            rawData: data[symbol].data,
          };
        }
      }
    }
  }

  console.log('Cache state after fetching:', Object.keys(CACHE).map(symbol => (
    { symbol, startDate: CACHE[symbol] ? CACHE[symbol].startDate : 'N/A' })));

  // Merge the cached and fetched results.
  const combinedResults = {};
  for (const symbol of symbolsArr) {
    if (cachedResults[symbol]) {
      combinedResults[symbol] = cachedResults[symbol];
    } else if (fetchedResults[symbol]) {
      combinedResults[symbol] = fetchedResults[symbol];
    }
    // Symbols that did not fetch successfully will be skipped.
  }

  // Build the final chart datasets by processing each symbol's raw data.
  const closeDatasets = [];
  const volumeDatasets = [];

  // For each symbol, filter the raw data to include only those records on or after
  // the requested start date. Then, sort the data and compute the percentage differences.
  for (const symbol in combinedResults) {
    const ohlcv = combinedResults[symbol];
    // Filter records so that the date is >= requestedStartDate.
    const filteredOHLCV = ohlcv.filter((item) => item.date >= requestedStartDate);
    if (filteredOHLCV.length === 0) continue;

    // Sort by date to ensure correct order.
    filteredOHLCV.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Set the baseline to the first record from the filtered data.
    const baselineClose = filteredOHLCV[0].close;
    const baselineVolume = filteredOHLCV[0].volume;
    if (!baselineClose || !baselineVolume) continue;

    // Compute the percentage difference for closing price and volume.
    const closePoints = filteredOHLCV.map((item) => ({
      x: item.date,
      y: (((item.close - baselineClose) / baselineClose) * 100).toFixed(2),
    }));

    const volumePoints = filteredOHLCV.map((item) => ({
      x: item.date,
      y: (((item.volume - baselineVolume) / baselineVolume) * 100).toFixed(2),
    }));

    // Add the computed series to the datasets.
    closeDatasets.push({
      label: symbol,
      data: closePoints,
    });

    volumeDatasets.push({
      label: symbol,
      data: volumePoints,
    });
  }

  // Return the chart data in the same format as the original API function.
  return {
    closeChartData: { datasets: closeDatasets },
    volumeChartData: { datasets: volumeDatasets },
  };
}
