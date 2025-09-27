// Factory pattern for creating different types of visualizers

import { PhaseShiftVisualizer } from "./PhaseShiftVisualizer.js";
import { IntegralVisualizer } from "./IntegralVisualizer.js";

/**
 * Factory class for creating different types of visualizers
 */
export class VisualizerFactory {
  /**
   * Registry of available visualizer types
   */
  static visualizerTypes = {
    "phase-shift": {
      class: PhaseShiftVisualizer,
      name: "Phase Shift Visualizer",
      description:
        "Visualizes phase-shifted cosine decomposition into sine and cosine components",
    },
    integral: {
      class: IntegralVisualizer,
      name: "Integral Visualizer",
      description:
        "Visualizes how integration extracts cosine and sine components from phase-shifted cosine",
    },
    // Future visualizers can be added here
  };

  /**
   * Create a new visualizer instance
   * @param {string} type - Type of visualizer to create
   * @param {Object} config - Configuration object for the visualizer
   * @returns {BaseVisualizer} Visualizer instance
   * @throws {Error} If visualizer type is not supported
   */
  static create(type, config = {}) {
    // Validate visualizer type
    if (!this.isValidType(type)) {
      throw new Error(
        `Unknown visualizer type: "${type}". Available types: ${this.getAvailableTypes().join(
          ", "
        )}`
      );
    }

    const visualizerInfo = this.visualizerTypes[type];
    const VisualizerClass = visualizerInfo.class;

    try {
      // Create instance with merged configuration
      const instance = new VisualizerClass(config);

      // Add metadata to the instance
      instance._factoryType = type;
      instance._factoryName = visualizerInfo.name;
      instance._factoryDescription = visualizerInfo.description;

      return instance;
    } catch (error) {
      throw new Error(
        `Failed to create ${visualizerInfo.name}: ${error.message}`
      );
    }
  }

  /**
   * Check if a visualizer type is valid
   * @param {string} type - Type to check
   * @returns {boolean} True if type is valid
   */
  static isValidType(type) {
    return type in this.visualizerTypes;
  }

  /**
   * Get list of available visualizer types
   * @returns {string[]} Array of available type names
   */
  static getAvailableTypes() {
    return Object.keys(this.visualizerTypes);
  }

  /**
   * Get information about available visualizers
   * @returns {Object} Object containing visualizer information
   */
  static getVisualizerInfo() {
    const info = {};
    Object.entries(this.visualizerTypes).forEach(([type, data]) => {
      info[type] = {
        name: data.name,
        description: data.description,
        available: true,
      };
    });
    return info;
  }

  /**
   * Register a new visualizer type
   * @param {string} type - Type identifier
   * @param {Function} visualizerClass - Visualizer class constructor
   * @param {string} name - Human-readable name
   * @param {string} description - Description of the visualizer
   */
  static registerVisualizer(type, visualizerClass, name, description) {
    if (this.isValidType(type)) {
      console.warn(
        `Visualizer type "${type}" is already registered. Overwriting...`
      );
    }

    this.visualizerTypes[type] = {
      class: visualizerClass,
      name,
      description,
    };
  }

  /**
   * Unregister a visualizer type
   * @param {string} type - Type to unregister
   */
  static unregisterVisualizer(type) {
    if (this.isValidType(type)) {
      delete this.visualizerTypes[type];
    }
  }

  /**
   * Create a visualizer from a configuration object that includes the type
   * @param {Object} fullConfig - Configuration object with 'type' property
   * @returns {BaseVisualizer} Visualizer instance
   */
  static createFromConfig(fullConfig) {
    if (!fullConfig || typeof fullConfig !== "object") {
      throw new Error("Configuration must be an object");
    }

    if (!fullConfig.type) {
      throw new Error('Configuration must include a "type" property');
    }

    const { type, ...config } = fullConfig;
    return this.create(type, config);
  }

  /**
   * Get default configuration for a specific visualizer type
   * @param {string} type - Visualizer type
   * @returns {Object} Default configuration
   */
  static getDefaultConfig(type) {
    if (!this.isValidType(type)) {
      throw new Error(`Unknown visualizer type: "${type}"`);
    }

    const VisualizerClass = this.visualizerTypes[type].class;

    // Create a temporary instance to get default config
    const tempInstance = new VisualizerClass();
    const defaultConfig = tempInstance.getDefaultConfig();

    // Clean up the temporary instance
    if (typeof tempInstance.destroy === "function") {
      tempInstance.destroy();
    }

    return defaultConfig;
  }
}
