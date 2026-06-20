// ui.js — pure rendering helpers. Reads state, writes DOM. No network.

(function () {
  "use strict";

  function cur() { return (window.STOCK_CONFIG && window.STOCK_CONFIG.currency) || "₹"; }
  function money(n) { return cur() + Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 }); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function fmtDate(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    return isNaN(d) ? "—" : d.toLocaleString();
  }

  function renderStats(state) {
    var m = Model.metrics(state);
    document.getElementById("statProducts").textContent = m.products;
    document.getElementById("statUnits").textContent = m.units;
    document.getElementById("statValue").textContent = money(m.value);
    document.getElementById("statLow").textContent = m.low;
  }

  function renderProducts(state, filter) {
    var body = document.getElementById("productBody");
    var q = (filter || "").trim().toLowerCase();
    var list = state.products.filter(function (p) {
      if (!q) return true;
      return (p.name + " " + p.sku + " " + p.category).toLowerCase().indexOf(q) !== -1;
    });

    body.innerHTML = list.map(function (p) {
      var low = p.qty <= p.minQty;
      return "<tr class='" + (low ? "row--low" : "") + "'>" +
        "<td>" + esc(p.name) + (low ? "<span class='badge-low'>LOW</span>" : "") + "</td>" +
        "<td>" + esc(p.category) + "</td>" +
        "<td class='col-sku'>" + esc(p.sku) + "</td>" +
        "<td class='num'>" + p.qty + "</td>" +
        "<td class='num'>" + p.minQty + "</td>" +
        "<td class='num'>" + money(p.price) + "</td>" +
        "<td class='num'>" + money(p.qty * p.price) + "</td>" +
        "<td class='num'>" +
          "<button class='btn btn--ghost btn--icon' title='Edit' data-edit='" + p.id + "'><svg class='icon'><use href='#i-edit'/></svg></button> " +
          "<button class='btn btn--danger btn--icon' title='Delete' data-del='" + p.id + "'><svg class='icon'><use href='#i-trash'/></svg></button>" +
        "</td></tr>";
    }).join("");

    document.getElementById("emptyProducts").hidden = list.length !== 0;
  }

  function renderCategoryOptions(state) {
    var seen = {};
    var opts = state.products.map(function (p) { return p.category; })
      .filter(function (c) { if (seen[c]) return false; seen[c] = 1; return true; })
      .map(function (c) { return "<option value='" + esc(c) + "'>"; }).join("");
    document.getElementById("catList").innerHTML = opts;
  }

  function renderMovementSelect(state) {
    var sel = document.getElementById("mvProduct");
    sel.innerHTML = state.products.map(function (p) {
      return "<option value='" + p.id + "'>" + esc(p.name) + " (" + p.qty + ")</option>";
    }).join("");
  }

  function renderMovements(state) {
    var byId = {};
    state.products.forEach(function (p) { byId[p.id] = p.name; });
    var rows = state.movements.slice().reverse().slice(0, 50);
    document.getElementById("movementBody").innerHTML = rows.map(function (m) {
      var color = m.type === "out" ? "var(--out)" : "var(--in)";
      return "<tr>" +
        "<td>" + fmtDate(m.at) + "</td>" +
        "<td>" + esc(byId[m.productId] || "(deleted)") + "</td>" +
        "<td style='color:" + color + ";font-weight:600'>" + m.type.toUpperCase() + "</td>" +
        "<td class='num'>" + m.qty + "</td>" +
        "<td>" + esc(m.note) + "</td></tr>";
    }).join("");
    document.getElementById("emptyMovements").hidden = state.movements.length !== 0;
  }

  function renderAll(state, filter) {
    document.getElementById("storeName").value = state.store || "My Store";
    renderStats(state);
    renderProducts(state, filter);
    renderCategoryOptions(state);
    renderMovementSelect(state);
    renderMovements(state);
    document.getElementById("lastSynced").textContent = fmtDate(state.updatedAt);
    if (window.Charts) Charts.renderAll(state);
  }

  window.UI = { renderAll: renderAll, fmtDate: fmtDate };
})();
