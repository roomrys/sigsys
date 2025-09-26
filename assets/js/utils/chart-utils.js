// Chart creation and management utilities

export class ChartManager {
  constructor() {
    this.charts = {};
    this.datasetVisibility = {};
  }

  /**
   * Create or update a line chart
   * @param {string} canvasId - Canvas element ID
   * @param {string} label - Chart label
   * @param {number[]} xData - X-axis data
   * @param {number[]} yData - Y-axis data
   * @param {string} borderColor - Line color
   * @param {Array} additionalDatasets - Additional datasets to include
   * @param {Object} options - Chart configuration options
   */
  createLineChart(
    canvasId,
    label,
    xData,
    yData,
    borderColor,
    additionalDatasets = [],
    options = {}
  ) {
    // Store current dataset visibility states before destroying
    if (this.charts[canvasId]) {
      this.datasetVisibility[canvasId] = {};
      this.charts[canvasId].data.datasets.forEach((dataset, index) => {
        const meta = this.charts[canvasId].getDatasetMeta(index);
        this.datasetVisibility[canvasId][index] = meta.hidden !== true;
      });
      this.charts[canvasId].destroy();
    }

    const ctx = document.getElementById(canvasId).getContext("2d");

    // Create the main dataset
    const mainDataset = {
      label: label,
      data: xData.map((x, i) => ({ x: x, y: yData[i] })),
      borderColor: borderColor,
      borderWidth: 2,
      fill: false,
    };

    // Combine main dataset with additional datasets
    const allDatasets = [mainDataset, ...additionalDatasets];

    // Default chart options
    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          display: options.showLegend || false,
          position: "top",
          onClick: (e, legendItem, legend) =>
            this.handleLegendClick(e, legendItem, legend, canvasId),
        },
      },
      scales: {
        x: {
          title: {
            display: options.xAxisTitle ? true : false,
            text: options.xAxisTitle || "",
          },
          type: "linear",
          min: options.xMin || -Math.PI,
          max: options.xMax || Math.PI,
          ticks: {
            stepSize: Math.PI,
            callback: function (value) {
              if (Math.abs(value + Math.PI) < 0.001) return "-π";
              if (Math.abs(value) < 0.001) return "0";
              if (Math.abs(value - Math.PI) < 0.001) return "π";
              return "";
            },
          },
          grid: {
            drawBorder: true,
            color: (context) =>
              Math.abs(context.tick.value) < 0.001
                ? "black"
                : "rgba(0,0,0,0.1)",
            lineWidth: (context) =>
              Math.abs(context.tick.value) < 0.001 ? 2 : 1,
          },
        },
        y: {
          title: {
            display: true,
            text: options.yAxisTitle || "Amplitude",
          },
          min: options.yMin || -1.05,
          max: options.yMax || 1.05,
          ticks: {
            stepSize: 0.5,
            callback: function (value) {
              // Special handling for flipped charts (like sine wave)
              if (options.flipYLabels) {
                if (Math.abs(value + 1) < 0.11) return "1";
                if (Math.abs(value) < 0.11) return "0";
                if (Math.abs(value - 1) < 0.11) return "-1";
                return "";
              } else {
                if (Math.abs(value + 1) < 0.11) return "-1";
                if (Math.abs(value) < 0.11) return "0";
                if (Math.abs(value - 1) < 0.11) return "1";
                return "";
              }
            },
          },
          grid: {
            drawBorder: true,
            color: (context) =>
              Math.abs(context.tick.value) < 0.001
                ? "black"
                : "rgba(0,0,0,0.1)",
            lineWidth: (context) =>
              Math.abs(context.tick.value) < 0.001 ? 2 : 1,
          },
        },
      },
    };

    // Merge with custom options
    const chartOptions = this.mergeOptions(
      defaultOptions,
      options.chartOptions || {}
    );

    this.charts[canvasId] = new Chart(ctx, {
      type: "line",
      data: { datasets: allDatasets },
      options: chartOptions,
    });

    // Restore dataset visibility states
    this.restoreDatasetVisibility(canvasId, allDatasets);
  }

  /**
   * Create or update a scatter plot (used for complex plane)
   * @param {string} canvasId - Canvas element ID
   * @param {Array} datasets - Chart datasets
   * @param {Object} options - Chart configuration options
   */
  createScatterChart(canvasId, datasets, options = {}) {
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    const canvas = document.getElementById(canvasId);
    const container = canvas.parentElement;

    // Force the container to be square if specified
    if (options.forceSquare) {
      const containerWidth = container.offsetWidth;
      container.style.height = containerWidth + "px";
    }

    const ctx = canvas.getContext("2d");

    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          display: options.showLegend || false,
          position: "top",
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: options.xAxisTitle || "X",
          },
          min: options.xMin || -1.2,
          max: options.xMax || 1.2,
          grid: {
            drawBorder: true,
            color: (context) =>
              Math.abs(context.tick.value) < 0.001
                ? "black"
                : "rgba(0,0,0,0.1)",
            lineWidth: (context) =>
              Math.abs(context.tick.value) < 0.001 ? 2 : 1,
          },
        },
        y: {
          title: {
            display: true,
            text: options.yAxisTitle || "Y",
          },
          min: options.yMin || -1.2,
          max: options.yMax || 1.2,
          grid: {
            drawBorder: true,
            color: (context) =>
              Math.abs(context.tick.value) < 0.001
                ? "black"
                : "rgba(0,0,0,0.1)",
            lineWidth: (context) =>
              Math.abs(context.tick.value) < 0.001 ? 2 : 1,
          },
        },
      },
    };

    const chartOptions = this.mergeOptions(
      defaultOptions,
      options.chartOptions || {}
    );

    this.charts[canvasId] = new Chart(ctx, {
      type: "scatter",
      data: { datasets },
      options: chartOptions,
    });
  }

  /**
   * Handle legend click events
   */
  handleLegendClick(e, legendItem, legend, canvasId) {
    const index = legendItem.datasetIndex;
    const chart = legend.chart;
    const meta = chart.getDatasetMeta(index);
    meta.hidden =
      meta.hidden === null ? !chart.data.datasets[index].hidden : null;
    chart.update();

    // Store the new visibility state
    if (!this.datasetVisibility[canvasId]) {
      this.datasetVisibility[canvasId] = {};
    }
    this.datasetVisibility[canvasId][index] = meta.hidden !== true;
  }

  /**
   * Restore dataset visibility states
   */
  restoreDatasetVisibility(canvasId, datasets) {
    if (this.datasetVisibility[canvasId]) {
      datasets.forEach((dataset, index) => {
        if (this.datasetVisibility[canvasId][index] === false) {
          const meta = this.charts[canvasId].getDatasetMeta(index);
          meta.hidden = true;
        }
      });
      this.charts[canvasId].update("none");
    }
  }

  /**
   * Deep merge chart options
   */
  mergeOptions(defaultOptions, customOptions) {
    const result = JSON.parse(JSON.stringify(defaultOptions));
    return this.deepMerge(result, customOptions);
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
   * Toggle legend visibility for a specific chart
   * @param {string} canvasId - Canvas element ID
   */
  toggleLegend(canvasId) {
    if (this.charts[canvasId]) {
      const currentDisplay =
        this.charts[canvasId].options.plugins.legend.display;
      this.charts[canvasId].options.plugins.legend.display = !currentDisplay;
      this.charts[canvasId].update("none");
    }
  }

  /**
   * Destroy a specific chart
   * @param {string} canvasId - Canvas element ID
   */
  destroyChart(canvasId) {
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
      delete this.charts[canvasId];
      delete this.datasetVisibility[canvasId];
    }
  }

  /**
   * Destroy all charts
   */
  destroyAll() {
    Object.keys(this.charts).forEach((canvasId) => {
      this.destroyChart(canvasId);
    });
  }

  /**
   * Get a chart instance
   * @param {string} canvasId - Canvas element ID
   * @returns {Chart|null} Chart instance or null if not found
   */
  getChart(canvasId) {
    return this.charts[canvasId] || null;
  }
}
