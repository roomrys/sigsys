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
   * Get a complete configuration template for integral visualization
   * @param {Object} overrides - Optional configuration overrides
   * @returns {Object} Integral configuration
   */
  static getIntegralConfig(overrides = {}) {
    const baseConfig = {
      type: "integral",
      timeRange: {
        start: 0,
        end: 2 * Math.PI,
        points: 200,
      },
      initialPhaseShift: Math.PI / 4,
      phaseStep: Math.PI / 100,
      initialAngularFrequency: 1.0,
      frequencyStep: 0.1,
      frequencyRange: {
        min: 0.5,
        max: 3.0,
      },
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
          showDecomposedSum: false,
        },
        nonPhaseShiftedCosine: {
          canvasId: "nonPhaseShiftedCosineChart",
          titleElementId: "nonPhaseShiftedCosineTitle",
          color: "blue",
          showDecomposedSum: false,
          showIntegrationArea: true,
          showIntegrationLine: true,
        },
        sineWave: {
          canvasId: "sineWaveChart",
          titleElementId: "sineWaveTitle",
          color: "green",
          showDecomposedSum: false,
          showXAxis: true,
          flipYLabels: true,
          showIntegrationArea: true,
          showIntegrationLine: true,
        },
        complexPlane: {
          canvasId: "complexPlaneChart",
        },
      },
      elements: {
        phaseShiftSlider: "phaseShiftSlider",
        phaseShiftValue: "phaseShiftValue",
        angularFrequencySlider: "angularFrequencySlider",
        angularFrequencyValue: "angularFrequencyValue",
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
      integral: this.getIntegralConfig(),
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
      integral: {
        name: "Integration Extraction Visualization",
        description:
          "Shows how integration extracts cosine and sine components from phase-shifted cosine",
        features: [
          "Integration area visualization",
          "Angular frequency adjustment",
          "Horizontal integration result lines",
          "Complex plane representation",
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
      case "integral":
        template = this.getIntegralConfig(overrides);
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
