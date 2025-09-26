// Mathematical calculations and formatting utilities

export class MathUtils {
  /**
   * Format labels as multiples of π
   * @param {number[]} labels - Array of numeric labels
   * @returns {string[]} Array of formatted π labels
   */
  static formatPiLabels(labels) {
    return labels.map((label) => {
      const multiple = (label / Math.PI).toFixed(2);
      if (multiple == 0) return "0";
      if (multiple == 1) return "π";
      if (multiple == -1) return "-π";
      return `${multiple}π`;
    });
  }

  /**
   * Format a phase shift value as a multiple of π
   * @param {number} phaseShift - Phase shift in radians
   * @returns {string} Formatted phase shift string
   */
  static formatPhaseShift(phaseShift) {
    const multiple = phaseShift / Math.PI;
    return multiple.toFixed(3) + "π";
  }

  /**
   * Generate unit circle points for complex plane visualization
   * @param {number} resolution - Number of points per π (default: 50)
   * @returns {Array} Array of {x, y} points
   */
  static generateUnitCirclePoints(resolution = 50) {
    const points = [];
    for (let angle = 0; angle <= 2 * Math.PI; angle += Math.PI / resolution) {
      points.push({
        x: Math.cos(angle),
        y: Math.sin(angle),
      });
    }
    return points;
  }

  /**
   * Generate evenly spaced labels for a given range
   * @param {number} start - Start value
   * @param {number} end - End value
   * @param {number} count - Number of points
   * @returns {number[]} Array of labels
   */
  static generateLabels(start, end, count) {
    return Array.from(
      { length: count },
      (_, i) => start + i * ((end - start) / (count - 1))
    );
  }
}

export class WaveformCalculator {
  /**
   * Calculate various waveforms for a given phase shift
   * @param {number[]} labels - Time labels
   * @param {number} phaseShift - Phase shift in radians
   * @returns {Object} Object containing calculated waveforms
   */
  static calculateWaveforms(labels, phaseShift) {
    const phaseShiftedCosine = labels.map((x) => Math.cos(x + phaseShift));
    const nonPhaseShiftedCosine = labels.map(
      (x) => Math.cos(phaseShift) * Math.cos(x)
    );
    const sineWave = labels.map((x) => -Math.sin(phaseShift) * Math.sin(x));
    const decomposedSum = labels.map(
      (x, i) => nonPhaseShiftedCosine[i] + sineWave[i]
    );

    return {
      phaseShiftedCosine,
      nonPhaseShiftedCosine,
      sineWave,
      decomposedSum,
    };
  }

  /**
   * Calculate complex exponential components
   * @param {number} phaseShift - Phase shift in radians
   * @returns {Object} Real and imaginary components
   */
  static calculateComplexComponents(phaseShift) {
    return {
      real: Math.cos(phaseShift),
      imaginary: Math.sin(phaseShift),
    };
  }
}
