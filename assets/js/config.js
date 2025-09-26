// Configuration and constants
const CONFIG = {
  labels: Array.from(
    { length: 100 },
    (_, i) => -Math.PI + i * ((2 * Math.PI) / 99)
  ),
  initialPhaseShift: Math.PI / 4,
  phaseStep: Math.PI / 100,

  // Chart display preferences
  legendVisible: {
    phaseShiftedCosineChart: true,
    nonPhaseShiftedCosineChart: false,
    sineWaveChart: false,
    complexPlaneChart: false,
  },

  // Chart colors
  colors: {
    orange: "orange",
    blue: "blue",
    green: "green",
    red: "red",
    gray: "rgba(128, 128, 128, 0.5)",
    black: "rgba(0, 0, 0, 0.3)",
  },
};

// Global state
let charts = {};
let datasetVisibility = {};
