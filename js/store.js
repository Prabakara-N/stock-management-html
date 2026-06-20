// store.js — talks to OUR serverless proxy (/api/stock), never to JSONBin
// directly. The key lives on the server, so nothing secret is in the browser.

(function () {
  "use strict";

  var API = "/api/stock";

  // The proxy only works when served by Vercel (deployed, or `vercel dev`).
  // Opening index.html via file:// has no /api, so flag that for a clear message.
  function isServed() { return location.protocol === "http:" || location.protocol === "https:"; }

  function load() {
    return fetch(API, { method: "GET" })
      .then(function (r) {
        if (!r.ok) return r.json().then(function (j) { throw new Error(j.error || ("HTTP " + r.status)); });
        return r.json();
      })
      .then(function (doc) { return Model.normalize(doc); });
  }

  function save(state) {
    var doc = Object.assign({}, state, { updatedAt: new Date().toISOString() });
    return fetch(API, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(doc)
    }).then(function (r) {
      if (!r.ok) return r.json().then(function (j) { throw new Error(j.error || ("HTTP " + r.status)); });
      return r.json().then(function (j) { return Object.assign({}, doc, { updatedAt: j.updatedAt || doc.updatedAt }); });
    });
  }

  window.Store = { isServed: isServed, load: load, save: save };
})();
