let themeMode = import.meta.env.VITE_THEME_MODE;
if (themeMode === 'light') themeMode = 'light';
else if (themeMode === 'dark') themeMode = 'dark';
else themeMode = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';

const getRandomColor = themeMode === 'light' ? () => {
  const r = Math.floor(Math.random() * 200);
  const g = Math.floor(Math.random() * 200);
  const b = Math.floor(Math.random() * 200);
  return `rgb(${r}, ${g}, ${b})`;
} : () => {
  const r = 255 - Math.floor(Math.random() * 200);
  const g = 255 - Math.floor(Math.random() * 200);
  const b = 255 - Math.floor(Math.random() * 200);
  return `rgb(${r}, ${g}, ${b})`;
};

const parseRGB = (color) => {
  const start = color.indexOf('(');
  const end = color.indexOf(')');
  if (start < 0 || end < 0) return null;
  return color.slice(start + 1, end).split(',').map((n) => parseInt(n.trim(), 10));
};
// https://en.wikipedia.org/wiki/Color_difference
const calculateDistance = (color1, color2) => {
  const [r1, g1, b1] = color1;
  const [r2, g2, b2] = color2;
  const rMean = (r1 + r2) / 2;
  return Math.sqrt((2 + rMean / 256) * (r1 - r2) ** 2 + 4 * (g1 - g2) ** 2 + (2 + (255 - rMean) / 256) * (b1 - b2) ** 2) / 3;
};
const MAX_DISTANCE = { 2: 50, 3: 40, 4: 35, 5: 30 };
const DEFAULT_MAX_DISTANCE = 25;
const generateDistinctColorMapping = (labels) => {
  let colorMapping;
  let isValid = false;
  let count = 0;
  while (!isValid) {
    colorMapping = {};
    labels.forEach((label) => colorMapping[label] = getRandomColor());
    console.log(count, colorMapping);
    count++;

    const parsedColors = {};
    labels.forEach((label) => parsedColors[label] = parseRGB(colorMapping[label]));
    const maxDistance = MAX_DISTANCE[labels.length] || DEFAULT_MAX_DISTANCE;
    console.log(maxDistance);

    isValid = true;
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
};


const _applyVisualsToChart = (chartData, colorMapping) => {
  const updatedDatasets = chartData.datasets.map((dataset) => ({
    ...dataset,
    borderColor: colorMapping[dataset.label],
    backgroundColor: colorMapping[dataset.label],
  }));
  return { ...chartData, datasets: updatedDatasets };
};
const addVisualsToBothCharts = (closeChartData, volumeChartData) => {
  const labels = closeChartData.datasets.map((dataset) => dataset.label);
  const colorMapping = generateDistinctColorMapping(labels);
  return {
    closeChartData: _applyVisualsToChart(closeChartData, colorMapping),
    volumeChartData: _applyVisualsToChart(volumeChartData, colorMapping),
  };
};

export {
  addVisualsToBothCharts,
};
