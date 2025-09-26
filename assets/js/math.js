// Mathematical calculations and formatting utilities

function formatPiLabels(labels) {
  return labels.map((label) => {
    const multiple = (label / Math.PI).toFixed(2);
    if (multiple == 0) return "0";
    if (multiple == 1) return "π";
    if (multiple == -1) return "-π";
    return `${multiple}π`;
  });
}

function formatPhaseShift(phaseShift) {
  const multiple = phaseShift / Math.PI;
  return multiple.toFixed(3) + "π";
}

// Calculate waveforms for given phase shift
function calculateWaveforms(labels, phaseShift) {
  return {
    phaseShiftedCosine: labels.map((x) => Math.cos(x + phaseShift)),
    nonPhaseShiftedCosine: labels.map(
      (x) => Math.cos(phaseShift) * Math.cos(x)
    ),
    sineWave: labels.map((x) => -Math.sin(phaseShift) * Math.sin(x)),
    get decomposedSum() {
      return labels.map(
        (x, i) => this.nonPhaseShiftedCosine[i] + this.sineWave[i]
      );
    },
  };
}

// Generate unit circle points for complex plane
function generateUnitCirclePoints() {
  const points = [];
  for (let angle = 0; angle <= 2 * Math.PI; angle += Math.PI / 50) {
    points.push({
      x: Math.cos(angle),
      y: Math.sin(angle),
    });
  }
  return points;
}
