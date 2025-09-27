import { BaseVisualizer } from "./BaseVisualizer.js";

export class IntegralVisualizer extends BaseVisualizer {
  constructor(config = {}) {
    super(config);
    this.phaseShift = config.initialPhaseShift || Math.PI / 4;
    this.angularFrequency = config.initialAngularFrequency || 1.0;
    this.charts = {}; // Store chart instances

    // Calculate and store the maximum period needed for the entire slider range
    // This ensures fixed time axis limits for better user experience
    this.maxDisplayPeriod = this.calculateMaxOrthogonalPeriod();
  }

  initialize() {
    this.initializeCharts();
    this.initializeControls();
    this.updateAllCharts();
  }

  initializeCharts() {
    // Create initial waveforms
    this.calculateWaveforms();

    // Create waveform charts using BaseVisualizer methods
    this.createWaveformCharts();
  }

  calculateWaveforms() {
    // Generate time arrays for display (full range) and integration (mathematically correct period)
    const tDisplay = this.generateTimeArray();
    const tIntegration = this.generateIntegrationTimeArray();

    // Composite waveform: cos(t) + sin(2t) + cos(3t + π/4)
    // cos(3t + π/4) = cos(3t)cos(π/4) - sin(3t)sin(π/4) = (√2/2)[cos(3t) - sin(3t)]
    const phaseShift = Math.PI / 4;

    // Create composite function
    const compositeFunction = (time) =>
      Math.cos(time) + Math.sin(2 * time) + Math.cos(3 * time + phaseShift);

    // Display data (for plotting over full visible range)
    const compositeWave = tDisplay.map(compositeFunction);

    // Calculate the maximum absolute value for y-axis scaling
    this.maxAmplitude = Math.max(...compositeWave.map(Math.abs));

    // Store time array for use in chart creation
    this.timeArray = tDisplay;

    this.waveforms = {
      composite: compositeWave,
      cosineProduct: tDisplay.map(
        (time) =>
          compositeFunction(time) * Math.cos(this.angularFrequency * time)
      ),
      sineProduct: tDisplay.map(
        (time) =>
          compositeFunction(time) * Math.sin(this.angularFrequency * time)
      ),
    };

    // Integration data (over mathematically correct period for accurate integration)
    this.integrationData = {
      cosineProduct: tIntegration.map(
        (time) =>
          compositeFunction(time) * Math.cos(this.angularFrequency * time)
      ),
      sineProduct: tIntegration.map(
        (time) =>
          compositeFunction(time) * Math.sin(this.angularFrequency * time)
      ),
    };

    // Calculate integrals using integration data
    this.waveforms.cosineIntegral = this.calculateCosineIntegral();
    this.waveforms.sineIntegral = this.calculateSineIntegral();
  }

  calculateCosineIntegral() {
    // Use numerical integration with integration-specific data
    return this.numericalIntegration(this.integrationData.cosineProduct);
  }

  calculateSineIntegral() {
    // Use numerical integration with integration-specific data
    return this.numericalIntegration(this.integrationData.sineProduct);
  }

  splitDataByIntegrationPeriod(data, timeArray) {
    // Split data into inside and outside integration period
    const integrationPeriod = this.calculateOrthogonalPeriod();
    const integrationStart = -integrationPeriod / 2;
    const integrationEnd = integrationPeriod / 2;

    const insideData = [];
    const outsideData = [];
    const insideLabels = [];
    const outsideLabels = [];

    for (let i = 0; i < timeArray.length; i++) {
      const time = timeArray[i];
      const value = data[i];
      const label = time.toFixed(2);

      if (time >= integrationStart && time <= integrationEnd) {
        // Inside integration period - use actual data
        insideData.push(value);
        insideLabels.push(label);
        outsideData.push(null); // No data for outside dataset at this point
        outsideLabels.push(label);
      } else {
        // Outside integration period - use actual data
        outsideData.push(value);
        outsideLabels.push(label);
        insideData.push(null); // No data for inside dataset at this point
        insideLabels.push(label);
      }
    }

    return {
      inside: { data: insideData, labels: insideLabels },
      outside: { data: outsideData, labels: outsideLabels },
      allLabels: timeArray.map((t) => t.toFixed(2)),
    };
  }

  splitDataByCompositePeriod(data, timeArray) {
    // Split data into inside and outside composite period (single period of composite function)
    const compositePeriod = this.calculateCompositePeriod();
    const periodStart = -compositePeriod / 2;
    const periodEnd = compositePeriod / 2;

    const insideData = [];
    const outsideData = [];
    const insideLabels = [];
    const outsideLabels = [];

    for (let i = 0; i < timeArray.length; i++) {
      const time = timeArray[i];
      const value = data[i];
      const label = time.toFixed(2);

      if (time >= periodStart && time <= periodEnd) {
        // Inside composite period - use actual data
        insideData.push(value);
        insideLabels.push(label);
        outsideData.push(null); // No data for outside dataset at this point
        outsideLabels.push(label);
      } else {
        // Outside composite period - use actual data
        outsideData.push(value);
        outsideLabels.push(label);
        insideData.push(null); // No data for inside dataset at this point
        insideLabels.push(label);
      }
    }

    return {
      inside: { data: insideData, labels: insideLabels },
      outside: { data: outsideData, labels: outsideLabels },
      allLabels: timeArray.map((t) => t.toFixed(2)),
    };
  }

  numericalIntegration(productData) {
    if (!productData || productData.length === 0) return 0;

    // Numerical integration using trapezoidal rule
    const integrationPeriod = this.calculateOrthogonalPeriod();
    const dt = integrationPeriod / productData.length;

    let integral = 0;
    for (let i = 0; i < productData.length - 1; i++) {
      // Trapezoidal rule: (f(i) + f(i+1)) * dt / 2
      integral += ((productData[i] + productData[i + 1]) * dt) / 2;
    }

    // Apply 2/T normalization for Fourier coefficients
    return (2 / integrationPeriod) * integral;
  }

  createWaveformCharts() {
    // Composite waveform chart
    if (!this.charts.composite) {
      this.charts.composite = this.createCompositeChart();
    } else {
      this.updateCompositeChart();
    }

    // Cosine integration chart with area fill
    if (!this.charts.cosineIntegration) {
      this.charts.cosineIntegration = this.createIntegrationChart(
        "nonPhaseShiftedCosineChart",
        this.waveforms.cosineProduct,
        this.waveforms.cosineIntegral,
        this.config.colors.blue
      );
    } else {
      this.updateIntegrationChart(
        this.charts.cosineIntegration,
        this.waveforms.cosineProduct,
        this.waveforms.cosineIntegral
      );
    }

    // Sine integration chart with area fill
    if (!this.charts.sineIntegration) {
      this.charts.sineIntegration = this.createIntegrationChart(
        "sineWaveChart",
        this.waveforms.sineProduct,
        this.waveforms.sineIntegral,
        this.config.colors.green
      );
    } else {
      this.updateIntegrationChart(
        this.charts.sineIntegration,
        this.waveforms.sineProduct,
        this.waveforms.sineIntegral
      );
    }
  }

  createCompositeChart() {
    const canvas = document.getElementById("phaseShiftedCosineChart");
    if (!canvas) return null;

    const ctx = canvas.getContext("2d");
    const splitData = this.splitDataByCompositePeriod(
      this.waveforms.composite,
      this.timeArray
    );

    return new Chart(ctx, {
      type: "line",
      data: {
        labels: splitData.allLabels,
        datasets: [
          {
            label: "Single Composite Period",
            data: splitData.inside.data,
            borderColor: "rgba(255, 165, 0, 1)", // Full opacity orange
            backgroundColor: "transparent",
            borderWidth: 3, // Bold for composite period
            pointRadius: 0,
            spanGaps: false,
          },
          {
            label: "Extended View",
            data: splitData.outside.data,
            borderColor: "rgba(255, 165, 0, 0.3)", // Lower opacity orange
            backgroundColor: "transparent",
            borderWidth: 1, // Thinner for outside period
            pointRadius: 0,
            spanGaps: false,
          },
        ],
      },
      options: this.getChartOptions(),
    });
  }

  updateCompositeChart() {
    if (!this.charts.composite) return;

    const splitData = this.splitDataByCompositePeriod(
      this.waveforms.composite,
      this.timeArray
    );

    // Update data
    this.charts.composite.data.labels = splitData.allLabels;
    this.charts.composite.data.datasets[0].data = splitData.inside.data; // Composite period
    this.charts.composite.data.datasets[1].data = splitData.outside.data; // Outside period

    // Update scale ranges
    const timeRange = this.getTimeRange();
    this.charts.composite.options.scales.x.min = timeRange.min;
    this.charts.composite.options.scales.x.max = timeRange.max;
    this.charts.composite.options.scales.x.ticks.stepSize =
      timeRange.period / 8;

    // Update y-axis limits based on maximum amplitude
    this.charts.composite.options.scales.y.min = -this.maxAmplitude * 1.1;
    this.charts.composite.options.scales.y.max = this.maxAmplitude * 1.1;

    this.charts.composite.update("none");
  }

  createIntegrationChart(canvasId, productData, integralValue, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const ctx = canvas.getContext("2d");
    const splitData = this.splitDataByIntegrationPeriod(
      productData,
      this.timeArray
    );
    const integralLine = this.timeArray.map(() => integralValue);

    // Convert color name to RGBA values
    const colorMap = {
      blue: { r: 0, g: 123, b: 255 },
      green: { r: 40, g: 167, b: 69 },
      orange: { r: 255, g: 165, b: 0 },
      red: { r: 220, g: 53, b: 69 },
    };

    const rgb = colorMap[color] || { r: 0, g: 123, b: 255 }; // Default to blue

    return new Chart(ctx, {
      type: "line",
      data: {
        labels: splitData.allLabels,
        datasets: [
          {
            label: "Product (Integration Period)",
            data: splitData.inside.data,
            borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`, // Full opacity
            backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`, // Bold fill for integration period
            borderWidth: 2,
            pointRadius: 0,
            fill: "origin",
            spanGaps: false,
          },
          {
            label: "Product (Outside Period)",
            data: splitData.outside.data,
            borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`, // Faded for outside period
            backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`, // Very light fill for outside period
            borderWidth: 1,
            pointRadius: 0,
            fill: "origin",
            spanGaps: false,
          },
          {
            label: "Integration Result",
            data: integralLine,
            borderColor: "#000000",
            backgroundColor: "transparent",
            borderWidth: 3,
            borderDash: [5, 5],
            pointRadius: 0,
          },
        ],
      },
      options: this.getChartOptions(),
    });
  }

  updateIntegrationChart(chart, productData, integralValue) {
    if (!chart) return;

    const splitData = this.splitDataByIntegrationPeriod(
      productData,
      this.timeArray
    );
    const integralLine = this.timeArray.map(() => integralValue);

    // Update data
    chart.data.labels = splitData.allLabels;
    chart.data.datasets[0].data = splitData.inside.data; // Inside integration period
    chart.data.datasets[1].data = splitData.outside.data; // Outside integration period
    chart.data.datasets[2].data = integralLine; // Integration result line

    // Update scale ranges
    const timeRange = this.getTimeRange();
    chart.options.scales.x.min = timeRange.min;
    chart.options.scales.x.max = timeRange.max;
    chart.options.scales.x.ticks.stepSize = timeRange.period / 8;

    // Update y-axis limits based on maximum amplitude
    chart.options.scales.y.min = -this.maxAmplitude * 1.1;
    chart.options.scales.y.max = this.maxAmplitude * 1.1;

    chart.update("none");
  }

  initializeControls() {
    // Phase shift slider
    const phaseShiftSlider = document.getElementById("phaseShiftSlider");
    const phaseShiftValue = document.getElementById("phaseShiftValue");

    if (phaseShiftSlider && phaseShiftValue) {
      phaseShiftSlider.min = "0";
      phaseShiftSlider.max = (2 * Math.PI).toString();
      phaseShiftSlider.step = "0.01";
      phaseShiftSlider.value = this.phaseShift.toString();

      phaseShiftSlider.addEventListener("input", (e) => {
        this.phaseShift = parseFloat(e.target.value);
        phaseShiftValue.textContent = this.formatPhaseValue(this.phaseShift);
        this.updateAllCharts();
      });

      phaseShiftValue.textContent = this.formatPhaseValue(this.phaseShift);
    }

    // Angular frequency slider
    const angularFrequencySlider = document.getElementById(
      "angularFrequencySlider"
    );
    const angularFrequencyValue = document.getElementById(
      "angularFrequencyValue"
    );

    if (angularFrequencySlider && angularFrequencyValue) {
      angularFrequencySlider.addEventListener("input", (e) => {
        this.angularFrequency = parseFloat(e.target.value);
        angularFrequencyValue.textContent = this.angularFrequency.toFixed(1);
        this.updateAllCharts();
      });

      angularFrequencyValue.textContent = this.angularFrequency.toFixed(1);
    }
  }

  updateAllCharts() {
    this.calculateWaveforms();
    this.createWaveformCharts();
    this.updateTitles();
  }

  updateTitles() {
    const phaseTitle = document.getElementById("phaseShiftedCosineTitle");
    const cosineTitle = document.getElementById("nonPhaseShiftedCosineTitle");
    const sineTitle = document.getElementById("sineWaveTitle");

    // Calculate integration results for display using the actual calculation methods
    const cosineIntegral = this.calculateCosineIntegral();
    const sineIntegral = this.calculateSineIntegral();

    if (phaseTitle) {
      this.renderMath(
        phaseTitle,
        `f(t) = \\cos(t) + \\sin(2t) + \\cos(3t + \\frac{\\pi}{4})`
      );
    }

    if (cosineTitle) {
      this.renderMath(
        cosineTitle,
        `\\color{gray}{\\frac{2}{T}\\int f(t)}\\color{black}{\\cos(\\color{#8e44ad}{\\texttt{${this.angularFrequency.toFixed(
          1
        )}}}\\color{black}{t})}\\color{gray}{dt = ${this.formatIntegralValue(
          cosineIntegral
        )}}`
      );
    }

    if (sineTitle) {
      this.renderMath(
        sineTitle,
        `\\color{gray}{\\frac{2}{T}\\int f(t)}\\color{black}{\\sin(\\color{#8e44ad}{\\texttt{${this.angularFrequency.toFixed(
          1
        )}}}\\color{black}{t})}\\color{gray}{dt = ${this.formatIntegralValue(
          sineIntegral
        )}}`
      );
    }

    // Check for discoveries and trigger visual effects
    this.checkForDiscoveries(cosineIntegral, sineIntegral);

    // Update dynamic formula
    this.updateDynamicFormula();
  }

  checkForDiscoveries(cosineIntegral, sineIntegral) {
    const omega = this.angularFrequency;
    const tolerance = 0.05; // Small tolerance for slider precision

    // Check for cosine component discoveries at exact frequencies
    if (
      Math.abs(omega - 1.0) < tolerance ||
      Math.abs(omega - 3.0) < tolerance
    ) {
      this.triggerDiscoveryEffect("nonPhaseShiftedCosineChart", "blue");
    }

    // Check for sine component discoveries at exact frequencies
    if (
      Math.abs(omega - 2.0) < tolerance ||
      Math.abs(omega - 3.0) < tolerance
    ) {
      this.triggerDiscoveryEffect("sineWaveChart", "green");
    }
  }

  triggerDiscoveryEffect(canvasId, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Remove any existing discovery effects
    canvas.classList.remove("discovery-glow-blue", "discovery-glow-green");

    // Force reflow to ensure the class removal takes effect
    canvas.offsetHeight;

    // Add the appropriate colored discovery effect
    const glowClass =
      color === "blue" ? "discovery-glow-blue" : "discovery-glow-green";
    canvas.classList.add(glowClass);

    // Create and show discovery badge
    this.showDiscoveryBadge(canvas, color);

    // Remove the effect after animation completes
    setTimeout(() => {
      if (canvas.classList.contains(glowClass)) {
        canvas.classList.remove(glowClass);
      }
    }, 3000); // 3 second duration
  }

  showDiscoveryBadge(canvas, color) {
    // Create badge element
    const badge = document.createElement("div");
    badge.className = `discovery-badge discovery-badge-${color}`;
    badge.innerHTML = `ω = ${this.angularFrequency.toFixed(1)}`;

    // Position badge within the chart area
    const container =
      canvas.closest(".chart-container") || canvas.parentElement;
    const rect = container.getBoundingClientRect();

    // Position badge in the top-right area of the chart
    badge.style.position = "absolute";
    badge.style.top = rect.top + window.scrollY + 15 + "px";
    badge.style.right = window.innerWidth - rect.right + 15 + "px";
    badge.style.zIndex = "1000";

    // Add to body
    document.body.appendChild(badge);

    // Remove badge after animation
    setTimeout(() => {
      if (badge.parentNode) {
        badge.parentNode.removeChild(badge);
      }
    }, 3000); // Same duration as glow effect
  }

  formatIntegralValue(value) {
    // Smart formatting: 0 decimal points except for 0.707 values
    if (Math.abs(value) < 0.001) {
      return "0";
    } else if (Math.abs(Math.abs(value) - 0.707) < 0.01) {
      // Handle 0.707 and -0.707 (√2/2) values
      return value < 0 ? "-0.707" : "0.707";
    } else {
      // Round to nearest integer for other values
      return Math.round(value).toString();
    }
  }

  updateDynamicFormula() {
    const formulaElement = document.getElementById("dynamicFormula");
    if (!formulaElement) return;

    // Show components based on current angular frequency
    const omega = this.angularFrequency;

    let htmlContent =
      '<span style="font-size: 1.2em; color: #ff7f00;">f(t)</span> = ';

    if (omega < 1.0) {
      // Below ω=1, show only base structure
      htmlContent += '<span style="color: #999;">⋯</span>';
    } else if (omega >= 1.0 && omega < 2.0) {
      // ω≥1, reveal cos(t) component in cosine color
      htmlContent +=
        '<span class="cosine-component">cos(t)</span> + <span style="color: #999;">⋯</span>';
    } else if (omega >= 2.0 && omega < 3.0) {
      // ω≥2, reveal sin(2t) component in sine color
      htmlContent +=
        '<span class="cosine-component">cos(t)</span> + <span class="sine-component">sin(2t)</span> + <span style="color: #999;">⋯</span>';
    } else if (omega >= 3.0) {
      // ω≥3, reveal the expanded form with proper coloring
      htmlContent +=
        '<span class="cosine-component">cos(t)</span> + ' +
        '<span class="sine-component">sin(2t)</span> + ' +
        '<span class="cosine-component">0.707cos(3t)</span> - ' +
        '<span class="sine-component">0.707sin(3t)</span>';
    }

    formulaElement.innerHTML = htmlContent;
  }

  renderMath(element, latex) {
    // Check if KaTeX is available, otherwise fall back to plain text
    if (typeof katex !== "undefined") {
      try {
        katex.render(latex, element, {
          throwOnError: false,
          displayMode: false,
        });
      } catch (e) {
        // Fallback to plain text if KaTeX fails
        element.textContent = latex
          .replace(/\\(\w+)/g, "$1")
          .replace(/[{}]/g, "");
      }
    } else {
      // Fallback: convert basic LaTeX to Unicode
      const fallbackText = latex
        .replace(/\\cos/g, "cos")
        .replace(/\\sin/g, "sin")
        .replace(/\\int/g, "∫")
        .replace(/\\frac\{2\}\{T\}/g, "2/T")
        .replace(/\\frac\{\\pi\}\{4\}/g, "π/4")
        .replace(/\\pi/g, "π")
        .replace(/[{}]/g, "");
      element.textContent = fallbackText;
    }
  }

  calculateMaxOrthogonalPeriod() {
    // Calculate the maximum period needed across the entire slider range (0.5 to 3.0)
    const sliderMin = 0.5;
    const sliderMax = 3.0;
    const sliderStep = 0.1;

    let maxPeriod = 0;

    // Check all possible slider values
    for (let omega = sliderMin; omega <= sliderMax; omega += sliderStep) {
      const period = this.calculateOrthogonalPeriodForOmega(omega);
      maxPeriod = Math.max(maxPeriod, period);
    }

    return maxPeriod;
  }

  calculateOrthogonalPeriodForOmega(omega) {
    // For true orthogonality, we need the LCM of all relevant periods:
    // 1. Composite signal components: cos(t)=2π, sin(2t)=π, cos(3t)=2π/3
    // 2. Integrating function: cos(ωt) or sin(ωt) = 2π/ω

    const compositePeriods = [2 * Math.PI, Math.PI, (2 * Math.PI) / 3];
    const integratingPeriod = (2 * Math.PI) / omega;

    // Calculate LCM of all periods
    const allPeriods = [...compositePeriods, integratingPeriod];
    return this.calculateLCMOfPeriods(allPeriods);
  }

  calculateOrthogonalPeriod() {
    // Use the current omega for integration calculations
    return this.calculateOrthogonalPeriodForOmega(this.angularFrequency);
  }

  calculateCompositePeriod() {
    // Calculate the period of just the composite function: cos(t) + sin(2t) + cos(3t + π/4)
    // Component periods: cos(t)=2π, sin(2t)=π, cos(3t)=2π/3
    const compositePeriods = [2 * Math.PI, Math.PI, (2 * Math.PI) / 3];
    return this.calculateLCMOfPeriods(compositePeriods);
  }

  calculateLCMOfPeriods(periods) {
    // Convert all periods to multiples of π for easier LCM calculation
    // All our periods are of the form (2π/n) where n is rational
    const piMultiples = periods.map((period) => period / Math.PI);

    // Find the LCM of these π-multiples
    const lcmMultiple = this.lcmOfRationalNumbers(piMultiples);

    // Convert back to actual period
    return lcmMultiple * Math.PI;
  }

  lcmOfRationalNumbers(numbers) {
    // Convert numbers to rational form {numerator, denominator}
    const rationals = numbers.map((num) => this.toRational(num));

    // LCM of fractions a/b and c/d is LCM(a,c) / GCD(b,d)
    let lcmNumerator = rationals[0].numerator;
    let gcdDenominator = rationals[0].denominator;

    for (let i = 1; i < rationals.length; i++) {
      lcmNumerator = this.lcm(lcmNumerator, rationals[i].numerator);
      gcdDenominator = this.gcd(gcdDenominator, rationals[i].denominator);
    }

    return lcmNumerator / gcdDenominator;
  }

  toRational(decimal, precision = 1e-10) {
    // Convert decimal to rational number approximation
    // Handle common cases exactly
    if (Math.abs(decimal - 2) < precision)
      return { numerator: 2, denominator: 1 }; // 2π
    if (Math.abs(decimal - 1) < precision)
      return { numerator: 1, denominator: 1 }; // π
    if (Math.abs(decimal - 2 / 3) < precision)
      return { numerator: 2, denominator: 3 }; // 2π/3

    // For 2π/ω cases, approximate ω as rational
    if (decimal > 0) {
      const reciprocal = 2 / decimal; // This gives us ω

      // Round ω to nearest simple fraction
      if (Math.abs(reciprocal - Math.round(reciprocal)) < precision) {
        // ω is close to an integer
        return { numerator: 2, denominator: Math.round(reciprocal) };
      } else {
        // Try common fractions like 1.5 = 3/2, 2.5 = 5/2, etc.
        const doubled = reciprocal * 2;
        if (Math.abs(doubled - Math.round(doubled)) < precision) {
          return { numerator: 4, denominator: Math.round(doubled) };
        }
      }
    }

    // Fallback: use continued fraction approximation
    return this.continuedFractionApprox(decimal);
  }

  continuedFractionApprox(x, maxDenominator = 100) {
    let a = Math.floor(x);
    let p0 = 1,
      p1 = a;
    let q0 = 0,
      q1 = 1;

    x = x - a;

    while (x > 1e-10 && q1 < maxDenominator) {
      x = 1 / x;
      a = Math.floor(x);

      let p2 = a * p1 + p0;
      let q2 = a * q1 + q0;

      if (q2 > maxDenominator) break;

      p0 = p1;
      p1 = p2;
      q0 = q1;
      q1 = q2;
      x = x - a;
    }

    return { numerator: p1, denominator: q1 };
  }

  gcd(a, b) {
    a = Math.abs(Math.round(a));
    b = Math.abs(Math.round(b));
    return b === 0 ? a : this.gcd(b, a % b);
  }

  lcm(a, b) {
    return Math.abs(a * b) / this.gcd(a, b);
  }

  generateTimeArray() {
    // Generate time array over the full display range for plotting
    const points = 800;
    const t = [];

    // Use the fixed display range so functions are plotted over the entire visible axis
    const tMin = -this.maxDisplayPeriod / 2;
    const tMax = this.maxDisplayPeriod / 2;

    for (let i = 0; i <= points; i++) {
      t.push(tMin + (i / points) * (tMax - tMin));
    }
    return t;
  }

  generateIntegrationTimeArray() {
    // Generate time array over the mathematically correct integration period
    const points = 800;
    const t = [];

    // Use the actual integration period for this omega value
    const integrationPeriod = this.calculateOrthogonalPeriod();
    const tMin = -integrationPeriod / 2;
    const tMax = integrationPeriod / 2;

    for (let i = 0; i <= points; i++) {
      t.push(tMin + (i / points) * (tMax - tMin));
    }
    return t;
  }

  getTimeRange() {
    // Use fixed maximum period for consistent display
    return {
      min: -this.maxDisplayPeriod / 2,
      max: this.maxDisplayPeriod / 2,
      period: this.maxDisplayPeriod,
    };
  }

  getChartOptions() {
    const timeRange = this.getTimeRange();
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "linear",
          position: "bottom",
          min: timeRange.min,
          max: timeRange.max,
          ticks: {
            stepSize: timeRange.period / 8,
            callback: function (value) {
              if (Math.abs(value) < 0.01) return "0";

              const piRatio = value / Math.PI;

              // Handle common fractions of π
              if (Math.abs(piRatio - 0.25) < 0.01) return "π/4";
              if (Math.abs(piRatio + 0.25) < 0.01) return "-π/4";
              if (Math.abs(piRatio - 0.5) < 0.01) return "π/2";
              if (Math.abs(piRatio + 0.5) < 0.01) return "-π/2";
              if (Math.abs(piRatio - 0.75) < 0.01) return "3π/4";
              if (Math.abs(piRatio + 0.75) < 0.01) return "-3π/4";
              if (Math.abs(piRatio - 1) < 0.01) return "π";
              if (Math.abs(piRatio + 1) < 0.01) return "-π";
              if (Math.abs(piRatio - 1.5) < 0.01) return "3π/2";
              if (Math.abs(piRatio + 1.5) < 0.01) return "-3π/2";
              if (Math.abs(piRatio - 2) < 0.01) return "2π";
              if (Math.abs(piRatio + 2) < 0.01) return "-2π";

              // For other values, express as multiples of π
              if (Math.abs(piRatio - Math.round(piRatio)) < 0.01) {
                const rounded = Math.round(piRatio);
                if (rounded === 0) return "0";
                if (rounded === 1) return "π";
                if (rounded === -1) return "-π";
                return `${rounded}π`;
              }

              // For fractional values, try to express as simple fractions of π
              const simplifyPiFraction = function (ratio) {
                const tolerance = 0.01;

                // Check common denominators
                for (let denom = 2; denom <= 8; denom++) {
                  const numerator = Math.round(ratio * denom);
                  if (Math.abs(ratio - numerator / denom) < tolerance) {
                    if (numerator === 0) return "0";
                    if (numerator === denom) return "π";
                    if (numerator === -denom) return "-π";
                    if (numerator === 1) return `π/${denom}`;
                    if (numerator === -1) return `-π/${denom}`;
                    return `${numerator}π/${denom}`;
                  }
                }

                return null;
              };

              const fraction = simplifyPiFraction(piRatio);
              if (fraction) return fraction;

              // Fallback to decimal with π
              return `${piRatio.toFixed(2)}π`;
            },
          },
          grid: {
            display: true,
            color: "#f0f0f0",
          },
        },
        y: {
          min: -(this.maxAmplitude || 3) * 1.1,
          max: (this.maxAmplitude || 3) * 1.1,
          grid: {
            display: true,
            color: "#f0f0f0",
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: false,
        },
      },
      elements: {
        line: {
          tension: 0,
        },
      },
      animation: {
        duration: 0,
      },
    };
  }

  formatPhaseValue(phase) {
    const piRatio = phase / Math.PI;
    if (Math.abs(piRatio) < 0.01) return "0";
    if (Math.abs(piRatio - 0.25) < 0.01) return "π/4";
    if (Math.abs(piRatio - 0.5) < 0.01) return "π/2";
    if (Math.abs(piRatio - 0.75) < 0.01) return "3π/4";
    if (Math.abs(piRatio - 1) < 0.01) return "π";
    if (Math.abs(piRatio - 1.25) < 0.01) return "5π/4";
    if (Math.abs(piRatio - 1.5) < 0.01) return "3π/2";
    if (Math.abs(piRatio - 1.75) < 0.01) return "7π/4";
    if (Math.abs(piRatio - 2) < 0.01) return "2π";
    return phase.toFixed(2);
  }
}
