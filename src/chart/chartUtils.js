let themeMode = import.meta.env.VITE_THEME_MODE;
if (themeMode === "light") {
  themeMode = "light";
} else if (themeMode === "dark") {
  themeMode = "dark";
} else {
  themeMode = window.matchMedia('(prefers-color-scheme: light)').matches ? "light" : "dark";
}

export function getRandomColor() {
  if (themeMode === "light") {
    const r = Math.floor(Math.random() * 192);
    const g = Math.floor(Math.random() * 192);
    const b = Math.floor(Math.random() * 192);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    const r = 255 - Math.floor(Math.random() * 192);
    const g = 255 - Math.floor(Math.random() * 192);
    const b = 255 - Math.floor(Math.random() * 192);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

/**
 * Optimized helper to parse an RGB color string.
 * It converts a string like "rgb(r, g, b)" into an array of numbers [r, g, b].
 *
 * @param {string} color - An rgb color string.
 * @returns {Array<number>|null} - An array containing the red, green, and blue values or null if parsing fails.
 */
function parseRGB(color) {
  const start = color.indexOf('(');
  const end = color.indexOf(')');
  if (start >= 0 && end >= 0) {
    return color
      .slice(start + 1, end)
      .split(',')
      .map(num => parseInt(num.trim(), 10));
  }
  return null;
}

/**
 * Helper function to calculate the Euclidean distance between two RGB arrays.
 *
 * @param {Array<number>} color1 - First color as an array of numbers.
 * @param {Array<number>} color2 - Second color as an array of numbers.
 * @returns {number} - The Euclidean distance between the two colors.
 */
function calculateDistance(color1, color2) {
  const [r1, g1, b1] = color1;
  const [r2, g2, b2] = color2;
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

/**
 * Generates a distinct color mapping for a set of labels.
 * It repeatedly constructs a mapping (by assigning random colors) and validates the mapping
 * by ensuring that every pair of colors is visually distinguishable.
 *
 * @param {Array<string>} labels - Array of unique labels.
 * @returns {object} - A valid color mapping with labels as keys and rgb color strings as values.
 */
const MAX_DISTANCE = {
  2: 80,
  3: 72,
  4: 60,
}
const DEFAULT_MAX_DISTANCE = 50;
function generateDistinctColorMapping(labels) {
  let colorMapping;
  let isValid = false;
  let count = 0;
  while (!isValid) {
    // Create a new mapping for this iteration.
    colorMapping = {};
    labels.forEach(label => {
      colorMapping[label] = getRandomColor();
    });
    console.log(count, colorMapping);
    count++;

    isValid = true;
    // Parse each color once per iteration.
    const parsedColors = {};
    labels.forEach(label => {
      parsedColors[label] = parseRGB(colorMapping[label]);
    });

    const maxDistance = MAX_DISTANCE[labels.length] || DEFAULT_MAX_DISTANCE;
    console.log(maxDistance);

    // Check every unique pair.
    for (let i = 0; i < labels.length; i++) {
      for (let j = i + 1; j < labels.length; j++) {
        if (calculateDistance(parsedColors[labels[i]], parsedColors[labels[j]]) <= maxDistance) {
          isValid = false;
          break;
        }
      }
      if (!isValid) break;
    }
  }
  return colorMapping;
}

/** 
 * Helper to apply visual properties (color, borderColor, etc.) to each dataset.
 *
 * @param {object} chartData - The chart data including datasets.
 * @param {object} colorMapping - Mapping of dataset labels to colors.
 * @returns {object} - The updated chart data with visuals applied.
 */
function _applyVisualsToChart(chartData, colorMapping) {
  const updatedDatasets = chartData.datasets.map(dataset => ({
    ...dataset,
    borderColor: colorMapping[dataset.label],
    backgroundColor: colorMapping[dataset.label],
    fill: false,
    tension: 0.2,
  }));
  return { ...chartData, datasets: updatedDatasets };
}

/**
 * Enhances both closing price and volume chart data with visuals using a shared color mapping.
 * This function uses the generateDistinctColorMapping helper function to create many
 * distinct colors at once.
 *
 * @param {object} closeChartData - Chart data for closing price.
 * @param {object} volumeChartData - Chart data for volume.
 * @returns {object} - Returns an object with updated closeChartData, volumeChartData, and the colorMapping.
 */
export function addVisualsToBothCharts(closeChartData, volumeChartData) {
  const labels = closeChartData.datasets.map(dataset => dataset.label);
  const colorMapping = generateDistinctColorMapping(labels);
  return {
    closeChartData: _applyVisualsToChart(closeChartData, colorMapping),
    volumeChartData: _applyVisualsToChart(volumeChartData, colorMapping),
    colorMapping,
  };
}
