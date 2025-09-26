// Main application logic and initialization using factory pattern and configuration-driven approach

import { VisualizerFactory } from "./visualizers/VisualizerFactory.js";
import { ConfigTemplates } from "./config/ConfigTemplates.js";
import { ConfigValidator } from "./config/ConfigValidator.js";
import { CONFIG } from "./config.js";

// Global visualizer instance
let currentVisualizer = null;

/**
 * Application configuration - easily changeable for different tools
 */
const APP_CONFIG = {
  // Change this to create different types of visualizers
  visualizerType: "phase-shift", // 'phase-shift', 'fourier', 'frequency-domain'

  // Override default configuration if needed
  configOverrides: {
    // Use legacy CONFIG for backward compatibility
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
  },

  // Error handling configuration
  errorHandling: {
    showErrorMessages: true,
    fallbackToConsole: true,
    retryOnFailure: false,
  },
};

/**
 * Initialize the visualization application using factory pattern
 */
function initializeApp() {
  try {
    // Get the appropriate configuration template
    const config = createVisualizerConfig(
      APP_CONFIG.visualizerType,
      APP_CONFIG.configOverrides
    );

    // Validate the configuration
    const validation = ConfigValidator.validate(
      config,
      APP_CONFIG.visualizerType
    );
    if (!validation.valid) {
      throw new Error(
        `Configuration validation failed: ${validation.errors.join(", ")}`
      );
    }

    // Create visualizer using factory
    currentVisualizer = VisualizerFactory.create(
      APP_CONFIG.visualizerType,
      validation.config
    );

    // Initialize the visualizer
    currentVisualizer.initialize();

    console.log(`Successfully initialized ${currentVisualizer._factoryName}`);
  } catch (error) {
    handleInitializationError(error);
  }
}

/**
 * Create visualizer configuration with validation
 * @param {string} type - Visualizer type
 * @param {Object} overrides - Configuration overrides
 * @returns {Object} Complete configuration
 */
function createVisualizerConfig(type, overrides = {}) {
  try {
    // Start with the appropriate template
    let config;
    switch (type) {
      case "phase-shift":
        config = ConfigTemplates.getPhaseShiftConfig(overrides);
        break;
      case "fourier":
        config = ConfigTemplates.getFourierConfig(overrides);
        break;
      case "frequency-domain":
        config = ConfigTemplates.getFrequencyDomainConfig(overrides);
        break;
      default:
        // Fallback to phase-shift with legacy CONFIG
        console.warn(
          `Unknown visualizer type: ${type}. Falling back to phase-shift.`
        );
        config = ConfigTemplates.fromLegacyConfig(CONFIG);
        break;
    }

    return config;
  } catch (error) {
    console.error("Failed to create configuration:", error);
    // Ultimate fallback
    return ConfigTemplates.fromLegacyConfig(CONFIG);
  }
}

/**
 * Handle initialization errors gracefully
 * @param {Error} error - The error that occurred
 */
function handleInitializationError(error) {
  const errorMessage = `Failed to initialize visualizer: ${error.message}`;

  console.error(errorMessage, error);

  if (APP_CONFIG.errorHandling.showErrorMessages) {
    // Try to show error in UI if possible
    const errorContainer = document.getElementById("error-message");
    if (errorContainer) {
      errorContainer.innerHTML = `
        <div style="color: red; background: #ffe6e6; border: 1px solid red; padding: 10px; margin: 10px 0; border-radius: 4px;">
          <strong>Initialization Error:</strong> ${error.message}
          <br><small>Check the console for more details.</small>
        </div>
      `;
      errorContainer.style.display = "block";
    }
  }

  // Try fallback initialization
  if (
    APP_CONFIG.errorHandling.retryOnFailure &&
    APP_CONFIG.visualizerType !== "phase-shift"
  ) {
    console.log("Attempting fallback to phase-shift visualizer...");
    APP_CONFIG.visualizerType = "phase-shift";
    APP_CONFIG.errorHandling.retryOnFailure = false; // Prevent infinite retry
    initializeApp();
  }
}

/**
 * Switch to a different visualizer type dynamically
 * @param {string} newType - New visualizer type
 * @param {Object} configOverrides - Optional configuration overrides
 */
function switchVisualizer(newType, configOverrides = {}) {
  try {
    // Clean up current visualizer
    if (currentVisualizer) {
      currentVisualizer.destroy();
      currentVisualizer = null;
    }

    // Update configuration
    APP_CONFIG.visualizerType = newType;
    APP_CONFIG.configOverrides = {
      ...APP_CONFIG.configOverrides,
      ...configOverrides,
    };

    // Initialize new visualizer
    initializeApp();
  } catch (error) {
    handleInitializationError(error);
  }
}

/**
 * Get information about available visualizers
 * @returns {Object} Available visualizer information
 */
function getAvailableVisualizers() {
  return VisualizerFactory.getVisualizerInfo();
}

/**
 * Clean up resources when the page is unloaded
 */
function cleanup() {
  if (currentVisualizer) {
    currentVisualizer.destroy();
    currentVisualizer = null;
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeApp);

// Clean up when page is unloaded
window.addEventListener("beforeunload", cleanup);

// Export for potential use by other modules
export { currentVisualizer, switchVisualizer, getAvailableVisualizers };
