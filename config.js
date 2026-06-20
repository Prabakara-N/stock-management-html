// Non-secret UI settings only. Safe to commit to GitHub.
// The JSONBin key is NOT here — it lives as a server env var (see api/stock.js).
window.STOCK_CONFIG = {
  currency: "₹",            // change to "$", "€", etc.
  showSku: false,           // set true to show the SKU/code column & field
  lowStockColor: "#ef5350"
};
