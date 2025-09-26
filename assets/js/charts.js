// Chart creation and management functions

function createChart(
  canvasId,
  label,
  data,
  borderColor,
  additionalDatasets = []
) {
  // Store current dataset visibility states before destroying
  if (charts[canvasId]) {
    datasetVisibility[canvasId] = {};
    charts[canvasId].data.datasets.forEach((dataset, index) => {
      const meta = charts[canvasId].getDatasetMeta(index);
      datasetVisibility[canvasId][index] = meta.hidden !== true;
    });
    charts[canvasId].destroy();
  }

  const ctx = document.getElementById(canvasId).getContext("2d");

  // Create the main dataset
  const mainDataset = {
    label: label,
    data: CONFIG.labels.map((x, i) => ({ x: x, y: data[i] })),
    borderColor: borderColor,
    borderWidth: 2,
    fill: false,
  };

  // Combine main dataset with additional datasets
  const allDatasets = [mainDataset, ...additionalDatasets];

  charts[canvasId] = new Chart(ctx, {
    type: "line",
    data: {
      datasets: allDatasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          display: CONFIG.legendVisible[canvasId],
          position: "top",
          onClick: function (e, legendItem, legend) {
            // Default legend click behavior (toggle dataset visibility)
            const index = legendItem.datasetIndex;
            const chart = legend.chart;
            const meta = chart.getDatasetMeta(index);
            meta.hidden =
              meta.hidden === null ? !chart.data.datasets[index].hidden : null;
            chart.update();

            // Store the new visibility state
            if (!datasetVisibility[canvasId]) {
              datasetVisibility[canvasId] = {};
            }
            datasetVisibility[canvasId][index] = meta.hidden !== true;
          },
        },
      },
      scales: {
        x: {
          title: {
            display: canvasId === "sineWaveChart",
            text: "Time (t)",
          },
          type: "linear",
          min: -Math.PI,
          max: Math.PI,
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
            text: "Amplitude",
          },
          min: -1.05,
          max: 1.05,
          ticks: {
            stepSize: 0.5,
            callback: function (value) {
              // Flip labels for sine chart to make negative values appear positive
              if (canvasId === "sineWaveChart") {
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
    },
  });

  // Restore dataset visibility states
  if (datasetVisibility[canvasId]) {
    allDatasets.forEach((dataset, index) => {
      if (datasetVisibility[canvasId][index] === false) {
        const meta = charts[canvasId].getDatasetMeta(index);
        meta.hidden = true;
      }
    });
    charts[canvasId].update("none"); // Update without animation
  }
}

function createComplexPlaneChart(phaseShift) {
  // Destroy existing chart if it exists
  if (charts["complexPlaneChart"]) {
    charts["complexPlaneChart"].destroy();
  }

  const canvas = document.getElementById("complexPlaneChart");
  const container = canvas.parentElement;

  // Force the container to be square based on its current width
  const containerWidth = container.offsetWidth;
  container.style.height = containerWidth + "px";

  const ctx = canvas.getContext("2d");

  // Single point representing cos(Φ) + i·sin(Φ)
  const realPart = Math.cos(phaseShift);
  const imagPart = Math.sin(phaseShift);

  // Create unit circle for reference
  const unitCirclePoints = generateUnitCirclePoints();

  charts["complexPlaneChart"] = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Unit Circle",
          data: unitCirclePoints,
          borderColor: CONFIG.colors.gray,
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
            { x: realPart, y: 0 }, // Vertical line start (on real axis)
            { x: realPart, y: imagPart }, // Main point
            { x: 0, y: imagPart }, // Horizontal line start (on imaginary axis)
            { x: realPart, y: imagPart }, // Main point again
          ],
          borderColor: CONFIG.colors.black,
          backgroundColor: "transparent",
          borderWidth: 1,
          borderDash: [3, 3],
          pointRadius: 0,
          showLine: true,
          fill: false,
          segment: {
            borderColor: (ctx) => {
              // Different segments for vertical and horizontal lines
              if (ctx.p0DataIndex === 0 && ctx.p1DataIndex === 1)
                return CONFIG.colors.black; // Vertical
              if (ctx.p0DataIndex === 2 && ctx.p1DataIndex === 3)
                return CONFIG.colors.black; // Horizontal
              return "transparent"; // Hide connecting line
            },
          },
        },
        {
          label: "Real Projection",
          data: [{ x: realPart, y: 0 }],
          borderColor: CONFIG.colors.blue,
          backgroundColor: CONFIG.colors.blue,
          borderWidth: 2,
          pointRadius: 6,
          showLine: false,
          fill: false,
        },
        {
          label: "Imaginary Projection",
          data: [{ x: 0, y: imagPart }],
          borderColor: CONFIG.colors.green,
          backgroundColor: CONFIG.colors.green,
          borderWidth: 2,
          pointRadius: 6,
          showLine: false,
          fill: false,
        },
        {
          label: "e^(iΦ) = cos(Φ) + i·sin(Φ)",
          data: [{ x: realPart, y: imagPart }],
          borderColor: CONFIG.colors.orange,
          backgroundColor: CONFIG.colors.orange,
          borderWidth: 2,
          pointRadius: 8,
          showLine: false,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          display: CONFIG.legendVisible["complexPlaneChart"],
          position: "top",
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Real (cos(Φ))",
          },
          min: -1.2,
          max: 1.2,
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
            text: "Imaginary (sin(Φ))",
          },
          min: -1.2,
          max: 1.2,
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
    },
  });
}

function toggleLegend(canvasId) {
  CONFIG.legendVisible[canvasId] = !CONFIG.legendVisible[canvasId];

  // Update the chart options and redraw
  if (charts[canvasId]) {
    charts[canvasId].options.plugins.legend.display =
      CONFIG.legendVisible[canvasId];
    charts[canvasId].update("none");
  }
}
