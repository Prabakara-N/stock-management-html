==============================================================================
STOCK MANAGER — simple inventory for ONE store
Pure static site (HTML/CSS/JS). No backend, no localStorage.
Syncs laptop + mobile via a free JSONBin bin. Hosts on GitHub Pages.
==============================================================================

WHAT IT DOES
  - Add / edit / delete products (category, optional SKU, qty, min-qty, price, cost)
  - Record Stock IN / Stock OUT movements (auto-adjusts qty + keeps history)
  - Dashboard with graphs: quantity on hand, value by category, low-stock
  - Export CSV (products & movements) and JSON backup; import JSON to restore
  - Phone + laptop show the SAME data (it lives in one cloud bin)

------------------------------------------------------------------------------
READ THIS FIRST — SECURITY
------------------------------------------------------------------------------
  This is a no-backend app, so the JSONBin key is shipped inside config.js and
  is PUBLIC. That is fine ONLY if you follow these rules:
    * Use a JSONBin ACCESS KEY scoped to this ONE bin (Read + Update).
    * NEVER put your account MASTER KEY in config.js or any committed file.
      (If you ever pasted a Master Key, go rotate/regenerate it now.)
  Worst case if the Access Key leaks: someone can read/edit THIS stock bin only
  — not your account, not other bins. Acceptable for a small private store tool.

------------------------------------------------------------------------------
ONE-TIME SETUP
------------------------------------------------------------------------------
1. Make the cloud bin (free):
   - Sign up at https://jsonbin.io
   - Create a Bin with content exactly:  {"products":[],"movements":[]}
   - Copy the BIN ID.

2. Make a bin-scoped Access Key:
   - Open "API Keys" (or "Access Keys").
   - Create an Access Key with READ and UPDATE permission, restricted to the
     bin you just made. Copy it.

3. Fill in config.js:
        binId:     "your bin id"
        accessKey: "your access key"
   (Optional: currency "₹"/"$"/"€", and showSku: true to show the SKU column.)

4. Test locally (optional): just double-click index.html. Because the app calls
   JSONBin over https, sync works straight from the file.

------------------------------------------------------------------------------
PUBLISH ON GITHUB PAGES
------------------------------------------------------------------------------
1. Push this folder to a GitHub repo.
2. Repo -> Settings -> Pages.
3. Source: "Deploy from a branch" -> Branch: main -> Folder: / (root) -> Save.
4. Wait ~1 minute. GitHub gives you a URL like:
        https://<your-username>.github.io/<repo-name>/
5. Share that URL with your friend. Open it on laptop AND phone — same data.
   (Mobile tip: browser menu -> "Add to Home Screen" for an app-like icon.)

------------------------------------------------------------------------------
HOW SYNC WORKS
------------------------------------------------------------------------------
  - On open: app reads the bin and shows it.
  - On any change: it writes the whole document (~1s after a change). "Save now"
    forces an immediate save.
  - "Reload" pulls the latest (use it to see edits from the other device).
  - Last-write-wins. For one store that's safe; press Reload before editing if
    both of you were using it at the same moment.

------------------------------------------------------------------------------
FILES
------------------------------------------------------------------------------
  index.html         layout + loads Chart.js (CDN) and the scripts below
  styles.css         responsive, mobile-first styling + bottom tab bar
  config.js          YOUR bin id + bin-scoped Access Key + UI settings (committed)
  js/model.js        pure inventory logic (immutable add/edit/delete/movement)
  js/store.js        reads/writes the JSONBin bin directly
  js/export.js       CSV/JSON export + JSON import
  js/charts.js       the three Chart.js graphs
  js/ui.js           rendering (tables, stats, selects)
  js/app.js          controller: state, events, load-on-start, debounced save

------------------------------------------------------------------------------
LIMITATIONS
------------------------------------------------------------------------------
  - Access Key is public (see Security). Keep it bin-scoped.
  - Last-write-wins on simultaneous edits. No accounts / multi-store (kept simple).
  - Free JSONBin has generous limits; plenty for one small store.
==============================================================================
