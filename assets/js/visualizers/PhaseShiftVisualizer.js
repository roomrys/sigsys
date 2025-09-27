// Phase shift visualization class extending BaseVisualizer

import { BaseVisualizer } from "./BaseVisualizer.js";
import { MathUtils, WaveformCalculator } from "./../utils/calculations.js";

export class PhaseShiftVisualizer extends BaseVisualizer {
  constructor(config = {}) {
    super(config);
    this.waveforms = null;
  }

  /**
   * Get default configuration specific to phase shift visualization
   * @returns {Object} Default configuration
   */
  getDefaultConfig() {
    const baseConfig = super.getDefaultConfig();

    return {
      ...baseConfig,
      // Specific chart configurations for phase shift visualization
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
    };
  }

  /**
   * Calculate all required waveforms for the current phase shift
   * @param {number} phaseShift - Phase shift in radians
   */
  calculateWaveforms(phaseShift) {
    const timeLabels = this.generateTimeLabels();
    this.waveforms = WaveformCalculator.calculateWaveforms(
      timeLabels,
      phaseShift
    );
  }

  /**
   * Update chart titles based on current phase shift
   * @param {number} phaseShift - Current phase shift value
   */
  updateTitles(phaseShift) {
    const phaseStr = MathUtils.formatPhaseShift(phaseShift);
    const cosPhase = Math.cos(phaseShift).toFixed(3);
    const sinPhase = (-Math.sin(phaseShift)).toFixed(3);
    const sinPhaseFlipped = Math.sin(phaseShift).toFixed(3); // Flipped for visual consistency

    // Update title elements if they exist
    const phaseShiftedTitle = document.getElementById(
      this.config.charts.phaseShiftedCosine.titleElementId
    );
    if (phaseShiftedTitle) {
      phaseShiftedTitle.textContent = `cos(t + ${phaseStr})`;
    }

    const nonPhaseShiftedTitle = document.getElementById(
      this.config.charts.nonPhaseShiftedCosine.titleElementId
    );
    if (nonPhaseShiftedTitle) {
      nonPhaseShiftedTitle.textContent = `${cosPhase}cos(t)`;
    }

    const sineTitle = document.getElementById(
      this.config.charts.sineWave.titleElementId
    );
    if (sineTitle) {
      sineTitle.textContent = `${sinPhaseFlipped}sin(t)`;
    }
  }

  /**
   * Create the decomposed sum dataset for overlay
   * @returns {Object} Decomposed sum dataset
   */
  createDecomposedSumDataset() {
    const timeLabels = this.generateTimeLabels();

    return {
      label: "Decomposed Sum",
      data: timeLabels.map((x, i) => ({
        x: x,
        y: this.waveforms.decomposedSum[i],
      })),
      borderColor: this.config.colors.red,
      borderWidth: 5,
      borderDash: [5, 5],
      fill: false,
    };
  }

  /**
   * Create all waveform charts
   * @param {number} phaseShift - Current phase shift
   */
  createWaveformCharts(phaseShift) {
    // Calculate waveforms
    this.calculateWaveforms(phaseShift);

    const decomposedSumDataset = this.createDecomposedSumDataset();

    // Create phase-shifted cosine chart with decomposed sum overlay
    const phaseShiftedConfig = this.config.charts.phaseShiftedCosine;
    this.createWaveformChart(
      phaseShiftedConfig.canvasId,
      "Phase-Shifted Cosine",
      this.waveforms.phaseShiftedCosine,
      this.config.colors[phaseShiftedConfig.color],
      phaseShiftedConfig.showDecomposedSum ? [decomposedSumDataset] : []
    );

    // Create non-phase-shifted cosine chart
    const nonPhaseShiftedConfig = this.config.charts.nonPhaseShiftedCosine;
    this.createWaveformChart(
      nonPhaseShiftedConfig.canvasId,
      "Non-Phase-Shifted Cosine",
      this.waveforms.nonPhaseShiftedCosine,
      this.config.colors[nonPhaseShiftedConfig.color]
    );

    // Create sine wave chart
    const sineConfig = this.config.charts.sineWave;
    this.createWaveformChart(
      sineConfig.canvasId,
      "Sine Wave",
      this.waveforms.sineWave,
      this.config.colors[sineConfig.color],
      [],
      {
        showXAxis: sineConfig.showXAxis,
        flipYLabels: sineConfig.flipYLabels,
      }
    );

    // Create complex plane chart
    this.createComplexPlaneChart(phaseShift);
  }

  /**
   * Handle phase shift changes
   * @param {number} phaseShift - New phase shift value
   */
  onPhaseShiftChange(phaseShift) {
    super.onPhaseShiftChange(phaseShift);
    this.updateChartsForPhaseShift(phaseShift);
  }

  /**
   * Update all charts for a new phase shift value
   * @param {number} phaseShift - New phase shift value
   */
  updateChartsForPhaseShift(phaseShift) {
    // Update titles
    this.updateTitles(phaseShift);

    // Update UI elements
    this.updateUI({ phaseShift });

    // Recreate all charts with new data
    this.createWaveformCharts(phaseShift);
  }

  /**
   * Render the complete phase shift visualization
   */
  render() {
    const phaseShift = this.state.phaseShift || this.config.initialPhaseShift;
    this.updateChartsForPhaseShift(phaseShift);
  }

  /**
   * Get current waveform data
   * @returns {Object|null} Current waveform data
   */
  getWaveforms() {
    return this.waveforms ? { ...this.waveforms } : null;
  }

  /**
   * Export current visualization data
   * @returns {Object} Visualization data including configuration and state
   */
  exportData() {
    return {
      config: this.config,
      state: this.getState(),
      waveforms: this.getWaveforms(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Import and apply visualization data
   * @param {Object} data - Previously exported visualization data
   */
  importData(data) {
    if (data.config) {
      this.updateConfig(data.config);
    }

    if (data.state && data.state.phaseShift !== undefined) {
      // Update slider value if available
      if (this.elements.phaseShiftSlider) {
        this.elements.phaseShiftSlider.value = data.state.phaseShift;
      }

      // Update visualization
      this.onPhaseShiftChange(data.state.phaseShift);
    }
  }
}
