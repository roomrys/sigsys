// Predefined configuration templates for different visualizer types

import { ConfigValidator } from "./ConfigValidator.js";

/**
 * Configuration templates for different visualizer types
 */
export class ConfigTemplates {
  /**
   * Get a complete configuration template for phase shift visualization
   * @param {Object} overrides - Optional configuration overrides
   * @returns {Object} Phase shift configuration
   */
  static getPhaseShiftConfig(overrides = {}) {
    const baseConfig = {
      type: "phase-shift",
      timeRange: {
        start: -Math.PI,
        end: Math.PI,
        points: 100,
      },
      initialPhaseShift: Math.PI / 4,
      phaseStep: Math.PI / 100,
      legendVisible: {
        phaseShiftedCosineChart: true,
        nonPhaseShiftedCosineChart: false,
        sineWaveChart: false,
        complexPlaneChart: false,
      },
      colors: {
        orange: "orange",
        blue: "blue",
        green: "green",
        red: "red",
        gray: "rgba(128, 128, 128, 0.5)",
        black: "rgba(0, 0, 0, 0.3)",
      },
      charts: {
        phaseShiftedCosine: {
          canvasId: "phaseShiftedCosineChart",
          titleElementId: "phaseShiftedCosineTitle",
          color: "orange",
          showDecomposedSum: true,
        },
        nonPhaseShiftedCosine: {
          canvasId: "nonPhaseShiftedCosineChart",
          titleElementId: "nonPhaseShiftedCosineTitle",
          color: "blue",
          showDecomposedSum: false,
        },
        sineWave: {
          canvasId: "sineWaveChart",
          titleElementId: "sineWaveTitle",
          color: "green",
          showDecomposedSum: false,
          showXAxis: true,
          flipYLabels: true,
        },
        complexPlane: {
          canvasId: "complexPlaneChart",
        },
      },
      elements: {
        phaseShiftSlider: "phaseShiftSlider",
        phaseShiftValue: "phaseShiftValue",
      },
    };

    return ConfigValidator.deepMerge(baseConfig, overrides);
  }

  /**
   * Get all available configuration templates
   * @returns {Object} Object containing all available templates
   */
  static getAllTemplates() {
    return {
      "phase-shift": this.getPhaseShiftConfig(),
      //   fourier: this.getFourierConfig(),
      //   "frequency-domain": this.getFrequencyDomainConfig(),
    };
  }

  /**
   * Get template names and descriptions
   * @returns {Object} Template information
   */
  static getTemplateInfo() {
    return {
      "phase-shift": {
        name: "Phase Shift Visualization",
        description:
          "Interactive visualization of phase-shifted cosine decomposition",
        features: [
          "Real-time phase adjustment",
          "Complex plane representation",
          "Component decomposition",
        ],
      },
    };
  }

  /**
   * Validate and normalize any configuration template
   * @param {string} type - Template type
   * @param {Object} overrides - Configuration overrides
   * @returns {Object} Validated configuration
   */
  static getValidatedTemplate(type, overrides = {}) {
    let template;

    switch (type) {
      case "phase-shift":
        template = this.getPhaseShiftConfig(overrides);
        break;
    }

    // Validate the final configuration
    const validation = ConfigValidator.validate(template, type);
    if (!validation.valid) {
      throw new Error(
        `Template validation failed: ${validation.errors.join(", ")}`
      );
    }

    return validation.config;
  }
}
