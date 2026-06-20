// charts.js — three Chart.js charts that re-render from state.

(function () {
  "use strict";

  var instances = {};
  var PALETTE = ["#4f8cff", "#2eb872", "#f5a623", "#ef5350", "#a06bff",
                 "#26c6da", "#ff7043", "#9ccc65", "#ec407a", "#7e88a8"];

  function currency() { return (window.STOCK_CONFIG && window.STOCK_CONFIG.currency) || "₹"; }

  function destroy(key) {
    if (instances[key]) { instances[key].destroy(); delete instances[key]; }
  }

  var commonOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: "#9aa3b2" } } },
    scales: {
      x: { ticks: { color: "#9aa3b2" }, grid: { color: "#2a2f3a" } },
      y: { ticks: { color: "#9aa3b2" }, grid: { color: "#2a2f3a" }, beginAtZero: true }
    }
  };

  function renderQty(state) {
    destroy("qty");
    var top = state.products.slice().sort(function (a, b) { return b.qty - a.qty; }).slice(0, 12);
    instances.qty = new Chart(document.getElementById("chartQty"), {
      type: "bar",
      data: {
        labels: top.map(function (p) { return p.name; }),
        datasets: [{
          label: "Qty on hand",
          data: top.map(function (p) { return p.qty; }),
          backgroundColor: top.map(function (p) { return p.qty <= p.minQty ? "#ef5350" : "#4f8cff"; })
        }]
      },
      options: Object.assign({}, commonOpts, { plugins: { legend: { display: false } } })
    });
  }

  function renderCategory(state) {
    destroy("category");
    var map = Model.valueByCategory(state);
    var labels = Object.keys(map);
    instances.category = new Chart(document.getElementById("chartCategory"), {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [{
          data: labels.map(function (k) { return Math.round(map[k]); }),
          backgroundColor: labels.map(function (_, i) { return PALETTE[i % PALETTE.length]; })
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: "right", labels: { color: "#9aa3b2" } },
          tooltip: { callbacks: { label: function (c) { return c.label + ": " + currency() + c.parsed; } } }
        }
      }
    });
  }

  function renderLow(state) {
    destroy("low");
    var low = Model.lowStockItems(state).sort(function (a, b) { return a.qty - b.qty; }).slice(0, 12);
    instances.low = new Chart(document.getElementById("chartLow"), {
      type: "bar",
      data: {
        labels: low.map(function (p) { return p.name; }),
        datasets: [
          { label: "On hand", data: low.map(function (p) { return p.qty; }), backgroundColor: "#ef5350" },
          { label: "Min", data: low.map(function (p) { return p.minQty; }), backgroundColor: "#f5a623" }
        ]
      },
      options: Object.assign({}, commonOpts, { indexAxis: "y" })
    });
  }

  function renderAll(state) {
    renderQty(state);
    renderCategory(state);
    renderLow(state);
  }

  window.Charts = { renderAll: renderAll };
})();
