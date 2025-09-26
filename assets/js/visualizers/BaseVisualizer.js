// Base visualization class with common functionality

import { ChartManager } from "./../utils/chart-utils.js";
import { MathUtils, WaveformCalculator } from "./../utils/calculations.js";

export class BaseVisualizer {
  constructor(config = {}) {
    this.config = this.mergeConfig(this.getDefaultConfig(), config);
    this.chartManager = new ChartManager();
    this.state = {};

    // Initialize DOM elements if available
    this.initializeDOMElements();
  }

  /**
   * Get default configuration for the visualizer
   * @returns {Object} Default configuration
   */
  getDefaultConfig() {
    return {
      // Time domain configuration
      timeRange: {
        start: -Math.PI,
        end: Math.PI,
        points: 100,
      },

      // Default phase shift settings
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

      // UI elements
      elements: {
        phaseShiftSlider: "phaseShiftSlider",
        phaseShiftValue: "phaseShiftValue",
      },
    };
  }

  /**
   * Deep merge configuration objects
   * @param {Object} defaultConfig - Default configuration
   * @param {Object} userConfig - User-provided configuration
   * @returns {Object} Merged configuration
   */
  mergeConfig(defaultConfig, userConfig) {
    const result = JSON.parse(JSON.stringify(defaultConfig));
    return this.deepMerge(result, userConfig);
  }

  deepMerge(target, source) {
    for (const key in source) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        if (!target[key]) target[key] = {};
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  /**
   * Initialize DOM elements based on configuration
   */
  initializeDOMElements() {
    this.elements = {};

    // Find and store references to DOM elements
    Object.entries(this.config.elements).forEach(([key, elementId]) => {
      const element = document.getElementById(elementId);
      if (element) {
        this.elements[key] = element;
      }
    });
  }

  /**
   * Generate time labels based on configuration
   * @returns {number[]} Array of time labels
   */
  generateTimeLabels() {
    const { start, end, points } = this.config.timeRange;
    return MathUtils.generateLabels(start, end, points);
  }

  /**
   * Create a standard waveform chart
   * @param {string} canvasId - Canvas element ID
   * @param {string} title - Chart title
   * @param {number[]} data - Y-axis data
   * @param {string} color - Line color
   * @param {Array} additionalDatasets - Additional datasets
   * @param {Object} options - Chart options
   */
  createWaveformChart(
    canvasId,
    title,
    data,
    color,
    additionalDatasets = [],
    options = {}
  ) {
    const timeLabels = this.generateTimeLabels();

    const chartOptions = {
      showLegend: this.config.legendVisible[canvasId] || false,
      xAxisTitle: options.showXAxis ? "Time (t)" : undefined,
      flipYLabels: options.flipYLabels || false,
      ...options,
    };

    this.chartManager.createLineChart(
      canvasId,
      title,
      timeLabels,
      data,
      color,
      additionalDatasets,
      chartOptions
    );
  }

  /**
   * Create a complex plane chart
   * @param {number} phaseShift - Current phase shift
   * @param {Object} options - Chart options
   */
  createComplexPlaneChart(phaseShift, options = {}) {
    const components =
      WaveformCalculator.calculateComplexComponents(phaseShift);
    const unitCirclePoints = MathUtils.generateUnitCirclePoints();

    // Create datasets for complex plane visualization
    const datasets = [
      {
        label: "Unit Circle",
        data: unitCirclePoints,
        borderColor: this.config.colors.gray,
        backgroundColor: "transparent",
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
        showLine: true,
        fill: false,
      },
      {
        label: "Projection Lines",
        data: [
          { x: components.real, y: 0 },
          { x: components.real, y: components.imaginary },
          { x: 0, y: components.imaginary },
          { x: components.real, y: components.imaginary },
        ],
        borderColor: this.config.colors.black,
        backgroundColor: "transparent",
        borderWidth: 1,
        borderDash: [3, 3],
        pointRadius: 0,
        showLine: true,
        fill: false,
        segment: {
          borderColor: (ctx) => {
            if (ctx.p0DataIndex === 0 && ctx.p1DataIndex === 1)
              return this.config.colors.black;
            if (ctx.p0DataIndex === 2 && ctx.p1DataIndex === 3)
              return this.config.colors.black;
            return "transparent";
          },
        },
      },
      {
        label: "Real Projection",
        data: [{ x: components.real, y: 0 }],
        borderColor: this.config.colors.blue,
        backgroundColor: this.config.colors.blue,
        borderWidth: 2,
        pointRadius: 6,
        showLine: false,
        fill: false,
      },
      {
        label: "Imaginary Projection",
        data: [{ x: 0, y: components.imaginary }],
        borderColor: this.config.colors.green,
        backgroundColor: this.config.colors.green,
        borderWidth: 2,
        pointRadius: 6,
        showLine: false,
        fill: false,
      },
      {
        label: "e^(iΦ) = cos(Φ) + i·sin(Φ)",
        data: [{ x: components.real, y: components.imaginary }],
        borderColor: this.config.colors.orange,
        backgroundColor: this.config.colors.orange,
        borderWidth: 2,
        pointRadius: 8,
        showLine: false,
        fill: false,
      },
    ];

    const chartOptions = {
      showLegend: this.config.legendVisible.complexPlaneChart || false,
      forceSquare: true,
      xAxisTitle: "Real (cos(Φ))",
      yAxisTitle: "Imaginary (sin(Φ))",
      xMin: -1.2,
      xMax: 1.2,
      yMin: -1.2,
      yMax: 1.2,
      ...options,
    };

    this.chartManager.createScatterChart(
      "complexPlaneChart",
      datasets,
      chartOptions
    );
  }

  /**
   * Update UI elements (to be overridden by subclasses)
   * @param {Object} params - Parameters for updating UI
   */
  updateUI(params) {
    // Base implementation - can be overridden
    if (this.elements.phaseShiftValue && params.phaseShift !== undefined) {
      this.elements.phaseShiftValue.textContent = MathUtils.formatPhaseShift(
        params.phaseShift
      );
    }
  }

  /**
   * Initialize slider configuration
   */
  initializeSlider() {
    if (this.elements.phaseShiftSlider) {
      this.elements.phaseShiftSlider.step = this.config.phaseStep;
      this.elements.phaseShiftSlider.max = 2 * Math.PI + this.config.phaseStep;
      this.elements.phaseShiftSlider.value = this.config.initialPhaseShift;
    }
  }

  /**
   * Add event listeners (to be overridden by subclasses)
   */
  addEventListeners() {
    // Base implementation for common events
    if (this.elements.phaseShiftSlider) {
      this.elements.phaseShiftSlider.addEventListener("input", (e) => {
        const phaseShift = parseFloat(e.target.value);
        this.onPhaseShiftChange(phaseShift);
      });
    }
  }

  /**
   * Handle phase shift changes (to be overridden by subclasses)
   * @param {number} phaseShift - New phase shift value
   */
  onPhaseShiftChange(phaseShift) {
    // Base implementation - update state
    this.state.phaseShift = phaseShift;
    this.updateUI({ phaseShift });
  }

  /**
   * Toggle legend visibility for a chart
   * @param {string} canvasId - Canvas element ID
   */
  toggleLegend(canvasId) {
    this.config.legendVisible[canvasId] = !this.config.legendVisible[canvasId];
    this.chartManager.toggleLegend(canvasId);
  }

  /**
   * Initialize the visualizer
   */
  initialize() {
    this.initializeSlider();
    this.addEventListeners();
    this.state.phaseShift = this.config.initialPhaseShift;
    this.render();
  }

  /**
   * Render all charts and UI elements (to be overridden by subclasses)
   */
  render() {
    // Base implementation - to be overridden
    console.warn("BaseVisualizer.render() should be overridden by subclasses");
  }

  /**
   * Destroy all charts and clean up
   */
  destroy() {
    this.chartManager.destroyAll();
  }

  /**
   * Get current state
   * @returns {Object} Current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration to merge
   */
  updateConfig(newConfig) {
    this.config = this.mergeConfig(this.config, newConfig);
  }
}
