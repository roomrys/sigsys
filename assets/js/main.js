// Main application logic and initialization using the new modular architecture

import { PhaseShiftVisualizer } from "./visualizers/PhaseShiftVisualizer.js";
import { CONFIG } from "./config.js";

// Global visualizer instance
let phaseShiftVisualizer = null;

/**
 * Initialize the phase shift visualization application
 */
function initializeApp() {
  // Create configuration object based on existing CONFIG
  const config = {
    timeRange: {
      start: CONFIG.labels[0],
      end: CONFIG.labels[CONFIG.labels.length - 1],
      points: CONFIG.labels.length,
    },
    initialPhaseShift: CONFIG.initialPhaseShift,
    phaseStep: CONFIG.phaseStep,
    legendVisible: CONFIG.legendVisible,
    colors: CONFIG.colors,
    elements: {
      phaseShiftSlider: "phaseShiftSlider",
      phaseShiftValue: "phaseShiftValue",
    },
  };

  // Create and initialize the visualizer
  phaseShiftVisualizer = new PhaseShiftVisualizer(config);
  phaseShiftVisualizer.initialize();
}

/**
 * Clean up resources when the page is unloaded
 */
function cleanup() {
  if (phaseShiftVisualizer) {
    phaseShiftVisualizer.destroy();
    phaseShiftVisualizer = null;
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeApp);

// Clean up when page is unloaded
window.addEventListener("beforeunload", cleanup);

// Export for potential use by other modules
export { phaseShiftVisualizer };
