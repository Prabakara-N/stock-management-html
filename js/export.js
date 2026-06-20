// export.js — CSV / JSON export and JSON import. All client-side, no server.

(function () {
  "use strict";

  function download(filename, text, mime) {
    var blob = new Blob([text], { type: mime || "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  // Escape one CSV cell.
  function cell(v) {
    var s = v == null ? "" : String(v);
    if (/[",\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function rowsToCsv(rows) {
    return rows.map(function (r) { return r.map(cell).join(","); }).join("\r\n");
  }

  function productsCsv(state) {
    var rows = [["name", "category", "sku", "qty", "minQty", "price", "cost", "value"]];
    state.products.forEach(function (p) {
      rows.push([p.name, p.category, p.sku, p.qty, p.minQty, p.price, p.cost, p.qty * p.price]);
    });
    download("products.csv", rowsToCsv(rows), "text/csv;charset=utf-8");
  }

  function movementsCsv(state) {
    var byId = {};
    state.products.forEach(function (p) { byId[p.id] = p.name; });
    var rows = [["when", "product", "type", "qty", "note"]];
    state.movements.forEach(function (m) {
      rows.push([m.at, byId[m.productId] || m.productId, m.type, m.qty, m.note]);
    });
    download("movements.csv", rowsToCsv(rows), "text/csv;charset=utf-8");
  }

  function jsonBackup(state) {
    download("stock-backup.json", JSON.stringify(state, null, 2), "application/json");
  }

  // Read a File object and resolve a normalized state. Rejects on bad JSON.
  function importJson(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var parsed = JSON.parse(reader.result);
          resolve(Model.normalize(parsed));
        } catch (e) {
          reject(new Error("That file is not valid JSON."));
        }
      };
      reader.onerror = function () { reject(new Error("Could not read the file.")); };
      reader.readAsText(file);
    });
  }

  window.Exporter = {
    productsCsv: productsCsv,
    movementsCsv: movementsCsv,
    jsonBackup: jsonBackup,
    importJson: importJson
  };
})();
