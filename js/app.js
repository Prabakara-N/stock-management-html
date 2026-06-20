// app.js — controller. Owns the single source of truth `state`, wires events,
// loads on start, and debounce-saves to the cloud on every change.

(function () {
  "use strict";

  var state = Model.emptyState();
  var saveTimer = null;
  var dirty = false;

  // ---- helpers -------------------------------------------------------------
  function $(id) { return document.getElementById(id); }

  function setSync(kind, text) {
    var dot = $("syncDot");
    dot.className = "dot dot--" + kind;
    $("syncText").textContent = text;
  }

  function banner(msg, kind) {
    var b = $("banner");
    b.hidden = false;
    b.className = "banner" + (kind ? " banner--" + kind : "");
    b.textContent = msg;
    if (kind === "ok") setTimeout(function () { b.hidden = true; }, 2500);
  }

  function render() { UI.renderAll(state, $("search").value); }

  // Replace state immutably and trigger a debounced cloud save.
  function commit(newState) {
    state = newState;
    dirty = true;
    render();
    scheduleSave();
  }

  function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 1000);
  }

  function saveNow() {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    if (!dirty) return;
    setSync("busy", "Saving…");
    Store.save(state).then(function (doc) {
      state = Object.assign({}, state, { updatedAt: doc.updatedAt });
      dirty = false;
      setSync("ok", "Saved " + UI.fmtDate(doc.updatedAt));
      $("lastSynced").textContent = UI.fmtDate(doc.updatedAt);
    }).catch(function (e) {
      setSync("err", "Save failed");
      banner(e.message + " — your changes are kept in memory; press “Save now” to retry.", "err");
    });
  }

  function loadFromCloud() {
    setSync("busy", "Loading…");
    Store.load().then(function (s) {
      state = s;
      dirty = false;
      render();
      setSync("ok", "Synced " + UI.fmtDate(s.updatedAt));
    }).catch(function (e) {
      setSync("err", "Load failed");
      banner(e.message + " — check your Bin ID / key in config.js, then Reload.", "err");
    });
  }

  // ---- navigation ----------------------------------------------------------
  function showView(name) {
    ["dashboard", "products", "movement", "data"].forEach(function (v) {
      $("view-" + v).hidden = v !== name;
    });
    document.querySelectorAll(".nav-btn").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-view") === name);
    });
  }

  // ---- product modal -------------------------------------------------------
  function openModal(product) {
    $("modalError").hidden = true;
    $("modalTitle").textContent = product ? "Edit product" : "Add product";
    $("fId").value = product ? product.id : "";
    $("fName").value = product ? product.name : "";
    $("fCategory").value = product ? product.category : "";
    $("fSku").value = product ? product.sku : "";
    $("fQty").value = product ? product.qty : 0;
    $("fMinQty").value = product ? product.minQty : 0;
    $("fPrice").value = product ? product.price : 0;
    $("fCost").value = product ? product.cost : 0;
    $("modal").hidden = false;
  }
  function closeModal() { $("modal").hidden = true; }

  function saveModal() {
    var input = {
      name: $("fName").value,
      category: $("fCategory").value || "Uncategorized",
      sku: $("fSku").value,
      qty: $("fQty").value,
      minQty: $("fMinQty").value,
      price: $("fPrice").value,
      cost: $("fCost").value
    };
    var check = Model.validateProduct(input);
    if (!check.ok) { var e = $("modalError"); e.textContent = check.error; e.hidden = false; return; }
    var id = $("fId").value;
    var next = id ? Model.updateProduct(state, id, input) : Model.addProduct(state, input);
    closeModal();          // close first, so a failed cloud save can't keep it open
    commit(next);
  }

  // ---- events --------------------------------------------------------------
  function wire() {
    document.querySelectorAll(".nav-btn").forEach(function (b) {
      b.addEventListener("click", function () { showView(b.getAttribute("data-view")); });
    });

    $("storeName").addEventListener("change", function () {
      commit(Object.assign({}, state, { store: $("storeName").value.trim() || "My Store" }));
    });

    $("search").addEventListener("input", render);
    $("addProductBtn").addEventListener("click", function () { openModal(null); });
    $("modalSave").addEventListener("click", saveModal);
    $("modalCancel").addEventListener("click", closeModal);
    $("modal").addEventListener("click", function (e) { if (e.target === $("modal")) closeModal(); });

    // Edit / delete via event delegation on the product table.
    $("productBody").addEventListener("click", function (e) {
      var editId = e.target.getAttribute("data-edit");
      var delId = e.target.getAttribute("data-del");
      if (editId) {
        var p = state.products.filter(function (x) { return x.id === editId; })[0];
        if (p) openModal(p);
      } else if (delId) {
        var prod = state.products.filter(function (x) { return x.id === delId; })[0];
        if (prod && confirm("Delete “" + prod.name + "”? This also removes its movements.")) {
          commit(Model.deleteProduct(state, delId));
        }
      }
    });

    // Movement buttons
    $("stockInBtn").addEventListener("click", function () { doMovement("in"); });
    $("stockOutBtn").addEventListener("click", function () { doMovement("out"); });

    // Data tab
    $("saveBtn").addEventListener("click", function () { dirty = true; saveNow(); });
    $("reloadBtn").addEventListener("click", loadFromCloud);
    $("reloadBtn2").addEventListener("click", loadFromCloud);
    $("csvProductsBtn").addEventListener("click", function () { Exporter.productsCsv(state); });
    $("csvMovementsBtn").addEventListener("click", function () { Exporter.movementsCsv(state); });
    $("jsonBackupBtn").addEventListener("click", function () { Exporter.jsonBackup(state); });
    $("importFile").addEventListener("change", function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      if (!confirm("Importing will OVERWRITE all current data. Continue?")) { e.target.value = ""; return; }
      Exporter.importJson(file).then(function (s) {
        commit(s);
        banner("Imported. Saving to cloud…", "ok");
      }).catch(function (err) { banner(err.message, "err"); });
      e.target.value = "";
    });

    // Save pending changes before the tab closes.
    window.addEventListener("beforeunload", function (ev) {
      if (dirty) { saveNow(); ev.preventDefault(); ev.returnValue = ""; }
    });
  }

  function doMovement(type) {
    var productId = $("mvProduct").value;
    var qty = $("mvQty").value;
    var note = $("mvNote").value;
    var res = Model.applyMovement(state, productId, type, qty, note);
    if (res.error) { banner(res.error, "err"); return; }
    commit(res.state);
    $("mvNote").value = "";
    $("mvQty").value = 1;
    banner("Stock " + type.toUpperCase() + " recorded.", "ok");
  }

  // ---- boot ----------------------------------------------------------------
  function boot() {
    if (!Store.hasConfig()) {
      // config.js still has placeholder values.
      $("setupScreen").hidden = false;
      $("app").hidden = true;
      setSync("err", "No config");
      return;
    }
    $("setupScreen").hidden = true;
    $("app").hidden = false;
    // SKU column/field is optional — hide unless config opts in.
    if (!(window.STOCK_CONFIG && window.STOCK_CONFIG.showSku)) {
      document.body.classList.add("hide-sku");
    }
    wire();
    showView("dashboard");
    loadFromCloud();
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
