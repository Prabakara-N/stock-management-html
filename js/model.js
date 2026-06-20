// model.js — pure, immutable helpers for the inventory data.
// No DOM, no network. Each function returns a NEW state object.

(function () {
  "use strict";

  function uid(prefix) {
    // time + random; good enough for one small store (no Date.now ban here, browser)
    return prefix + "_" + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
  }

  function emptyState() {
    return { store: "My Store", updatedAt: null, products: [], movements: [] };
  }

  // Accept whatever came back from the cloud and normalise it to a safe shape.
  function normalize(raw) {
    var base = emptyState();
    if (!raw || typeof raw !== "object") return base;
    return {
      store: typeof raw.store === "string" ? raw.store : base.store,
      updatedAt: raw.updatedAt || null,
      products: Array.isArray(raw.products) ? raw.products.map(normProduct).filter(Boolean) : [],
      movements: Array.isArray(raw.movements) ? raw.movements.map(normMovement).filter(Boolean) : []
    };
  }

  function num(v, def) {
    var n = Number(v);
    return isFinite(n) ? n : (def || 0);
  }

  function normProduct(p) {
    if (!p || typeof p !== "object") return null;
    return {
      id: p.id || uid("p"),
      name: String(p.name || "").trim(),
      category: String(p.category || "Uncategorized").trim() || "Uncategorized",
      sku: String(p.sku || "").trim(),
      qty: Math.max(0, num(p.qty, 0)),
      minQty: Math.max(0, num(p.minQty, 0)),
      price: Math.max(0, num(p.price, 0)),
      cost: Math.max(0, num(p.cost, 0))
    };
  }

  function normMovement(m) {
    if (!m || typeof m !== "object") return null;
    return {
      id: m.id || uid("m"),
      productId: m.productId || "",
      type: m.type === "out" ? "out" : "in",
      qty: Math.max(0, num(m.qty, 0)),
      note: String(m.note || ""),
      at: m.at || new Date().toISOString()
    };
  }

  // Validate a product form. Returns { ok, error }.
  function validateProduct(input) {
    if (!input.name || !String(input.name).trim()) return { ok: false, error: "Name is required." };
    var fields = ["qty", "minQty", "price", "cost"];
    for (var i = 0; i < fields.length; i++) {
      var v = Number(input[fields[i]]);
      if (!isFinite(v) || v < 0) return { ok: false, error: fields[i] + " must be a number ≥ 0." };
    }
    return { ok: true };
  }

  function addProduct(state, input) {
    var p = normProduct(Object.assign({ id: uid("p") }, input));
    return Object.assign({}, state, { products: state.products.concat([p]) });
  }

  function updateProduct(state, id, input) {
    var products = state.products.map(function (p) {
      return p.id === id ? normProduct(Object.assign({}, p, input, { id: id })) : p;
    });
    return Object.assign({}, state, { products: products });
  }

  function deleteProduct(state, id) {
    return Object.assign({}, state, {
      products: state.products.filter(function (p) { return p.id !== id; }),
      movements: state.movements.filter(function (m) { return m.productId !== id; })
    });
  }

  // Apply a stock IN/OUT movement. Returns { state, error }.
  function applyMovement(state, productId, type, qty, note) {
    var q = num(qty, 0);
    if (q <= 0) return { state: state, error: "Quantity must be greater than 0." };
    var prod = state.products.filter(function (p) { return p.id === productId; })[0];
    if (!prod) return { state: state, error: "Select a product." };

    var newQty = type === "out" ? prod.qty - q : prod.qty + q;
    if (newQty < 0) return { state: state, error: "Not enough stock. On hand: " + prod.qty + "." };

    var products = state.products.map(function (p) {
      return p.id === productId ? Object.assign({}, p, { qty: newQty }) : p;
    });
    var mv = normMovement({ id: uid("m"), productId: productId, type: type, qty: q, note: note, at: new Date().toISOString() });
    return { state: Object.assign({}, state, { products: products, movements: state.movements.concat([mv]) }), error: null };
  }

  // Derived metrics for the dashboard.
  function metrics(state) {
    var units = 0, value = 0, low = 0;
    state.products.forEach(function (p) {
      units += p.qty;
      value += p.qty * p.price;
      if (p.qty <= p.minQty) low += 1;
    });
    return { products: state.products.length, units: units, value: value, low: low };
  }

  function valueByCategory(state) {
    var map = {};
    state.products.forEach(function (p) {
      map[p.category] = (map[p.category] || 0) + p.qty * p.price;
    });
    return map;
  }

  function lowStockItems(state) {
    return state.products.filter(function (p) { return p.qty <= p.minQty; });
  }

  window.Model = {
    uid: uid,
    emptyState: emptyState,
    normalize: normalize,
    validateProduct: validateProduct,
    addProduct: addProduct,
    updateProduct: updateProduct,
    deleteProduct: deleteProduct,
    applyMovement: applyMovement,
    metrics: metrics,
    valueByCategory: valueByCategory,
    lowStockItems: lowStockItems
  };
})();
