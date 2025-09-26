// Main application logic and initialization

function updateTitles(phaseShift) {
  const phaseStr = formatPhaseShift(phaseShift);
  const cosPhase = Math.cos(phaseShift).toFixed(3);
  const sinPhase = (-Math.sin(phaseShift)).toFixed(3);
  const sinPhaseFlipped = Math.sin(phaseShift).toFixed(3); // Flipped for visual consistency

  document.getElementById(
    "phaseShiftedCosineTitle"
  ).textContent = `cos(t + ${phaseStr})`;
  document.getElementById(
    "nonPhaseShiftedCosineTitle"
  ).textContent = `${cosPhase}cos(t)`;
  document.getElementById(
    "sineWaveTitle"
  ).textContent = `${sinPhaseFlipped}sin(t)`;
}

function updateChartsForPhaseShift(phaseShift) {
  // Calculate waveforms
  const waveforms = calculateWaveforms(CONFIG.labels, phaseShift);

  // Update titles and slider display
  updateTitles(phaseShift);
  const phaseShiftValue = document.getElementById("phaseShiftValue");
  phaseShiftValue.textContent = formatPhaseShift(phaseShift);

  // Create additional dataset for decomposed sum
  const decomposedSumDataset = {
    label: "Decomposed Sum",
    data: CONFIG.labels.map((x, i) => ({
      x: x,
      y: waveforms.decomposedSum[i],
    })),
    borderColor: CONFIG.colors.red,
    borderWidth: 5,
    borderDash: [5, 5],
    fill: false,
  };

  // Create all charts
  createChart(
    "phaseShiftedCosineChart",
    "Phase-Shifted Cosine",
    waveforms.phaseShiftedCosine,
    CONFIG.colors.orange,
    [decomposedSumDataset]
  );
  createChart(
    "nonPhaseShiftedCosineChart",
    "Non-Phase-Shifted Cosine",
    waveforms.nonPhaseShiftedCosine,
    CONFIG.colors.blue
  );
  createChart(
    "sineWaveChart",
    "Sine Wave",
    waveforms.sineWave,
    CONFIG.colors.green
  );
  createComplexPlaneChart(phaseShift);
}

function initializeApp() {
  // Get DOM elements
  const phaseShiftSlider = document.getElementById("phaseShiftSlider");

  // Set the slider maximum to exactly 2π and step to π/100
  phaseShiftSlider.step = CONFIG.phaseStep;
  phaseShiftSlider.max = 2 * Math.PI + CONFIG.phaseStep; // Add a small step to include 2π

  // Initialize charts with initial phase shift
  updateChartsForPhaseShift(CONFIG.initialPhaseShift);

  // Add event listener for slider
  phaseShiftSlider.addEventListener("input", () => {
    const newPhaseShift = parseFloat(phaseShiftSlider.value);
    updateChartsForPhaseShift(newPhaseShift);
  });
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeApp);
