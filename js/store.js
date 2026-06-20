// store.js — calls JSONBin directly from the browser (pure static app).
// Uses a BIN-SCOPED ACCESS KEY (X-Access-Key) from config.js. That key is
// public (it ships in the page), so it MUST be an Access Key limited to this
// one bin — never the account Master Key.

(function () {
  "use strict";

  var BASE = "https://api.jsonbin.io/v3/b";

  function cfg() { return window.STOCK_CONFIG || {}; }

  function hasConfig() {
    var c = cfg();
    return !!(c.binId && c.accessKey &&
      c.binId.indexOf("PASTE_") !== 0 && c.accessKey.indexOf("PASTE_") !== 0);
  }

  function headers() {
    return { "Content-Type": "application/json", "X-Access-Key": cfg().accessKey };
  }

  function load() {
    return fetch(BASE + "/" + cfg().binId + "/latest", { headers: headers() })
      .then(function (r) {
        if (!r.ok) throw new Error("Load failed (HTTP " + r.status + ")");
        return r.json();
      })
      .then(function (json) { return Model.normalize(json && json.record ? json.record : json); });
  }

  function save(state) {
    var doc = Object.assign({}, state, { updatedAt: new Date().toISOString() });
    return fetch(BASE + "/" + cfg().binId, {
      method: "PUT",
      headers: Object.assign({ "X-Bin-Versioning": "false" }, headers()),
      body: JSON.stringify(doc)
    }).then(function (r) {
      if (!r.ok) throw new Error("Save failed (HTTP " + r.status + ")");
      return doc;
    });
  }

  window.Store = { hasConfig: hasConfig, load: load, save: save };
})();
