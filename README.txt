==============================================================================
STOCK MANAGER — simple inventory for ONE store
No traditional database. No localStorage. Syncs laptop + mobile.
The JSONBin key stays SECRET on a Vercel serverless function (not in the browser).
==============================================================================

WHAT IT DOES
  - Add / edit / delete products (category, SKU, qty, min-qty, price, cost)
  - Record Stock IN / Stock OUT movements (auto-adjusts qty + keeps history)
  - Dashboard with graphs: quantity on hand, value by category, low-stock
  - Export CSV (products & movements) and JSON backup; import JSON to restore
  - Phone + laptop show the SAME data (it lives in one cloud bin)

HOW IT'S SECURE
  - The browser calls OUR function at /api/stock.
  - That function (api/stock.js) talks to JSONBin using a key stored as a Vercel
    ENV VAR. The key is never sent to the browser, so it's safe to make the repo
    and the link public.

------------------------------------------------------------------------------
ONE-TIME SETUP
------------------------------------------------------------------------------
1. Make the cloud bin (free):
   - Sign up at https://jsonbin.io
   - Create a Bin with content exactly:  {"products":[],"movements":[]}
   - Copy the BIN ID.
   - Open "API Keys" and copy your MASTER KEY (or create a bin-scoped Access Key
     for tighter security — recommended).

2. Push this folder to GitHub.

3. Deploy on Vercel:
   - Go to https://vercel.com -> "Add New… -> Project" -> import your repo.
   - In Project Settings -> Environment Variables, add:
        JSONBIN_MASTER_KEY = <your key>
        JSONBIN_BIN_ID     = <your bin id>
   - Deploy. Vercel gives you a URL like  https://your-app.vercel.app

4. Share that URL with your friend. Open it on laptop AND phone — same data.
   (Tip on mobile: browser menu -> "Add to Home Screen" for an app-like icon.)

------------------------------------------------------------------------------
RUN / TEST LOCALLY (optional)
------------------------------------------------------------------------------
  The /api function needs Vercel's dev server (plain file:// or python http
  server won't have /api):
      npm i -g vercel
      cp .env.example .env        # then put your real key + bin id in .env
      vercel dev                  # open the printed http://localhost URL

------------------------------------------------------------------------------
HOW SYNC WORKS
------------------------------------------------------------------------------
  - On open: app GETs /api/stock and shows the data.
  - On any change: it PUTs the whole document (~1s after a change). "Save now"
    forces an immediate save.
  - "Reload" pulls the latest (use it to see edits made on the other device).
  - Last-write-wins. For one store that's safe; press Reload before editing if
    both of you were using it at the same moment.

------------------------------------------------------------------------------
FILES
------------------------------------------------------------------------------
  index.html         layout + loads Chart.js (CDN) and the scripts below
  styles.css         responsive, mobile-first styling + bottom tab bar
  config.js          NON-SECRET UI settings (currency). Safe to commit.
  vercel.json        Vercel config (clean URLs)
  .env.example       template for local env vars (copy to .env, gitignored)
  api/stock.js       serverless proxy; holds the key via env vars (GET/PUT)
  js/model.js        pure inventory logic (immutable add/edit/delete/movement)
  js/store.js        client that calls /api/stock (no key in browser)
  js/export.js       CSV/JSON export + JSON import
  js/charts.js       the three Chart.js graphs
  js/ui.js           rendering (tables, stats, selects)
  js/app.js          controller: state, events, load-on-start, debounced save

------------------------------------------------------------------------------
NOTES / LIMITATIONS
------------------------------------------------------------------------------
  - The key is server-side now, so a public repo + public link is fine. Do NOT
    commit your .env (it's gitignored). Set the key in Vercel env vars instead.
  - For least privilege, use a JSONBin Access Key scoped to just this one bin.
  - Last-write-wins on simultaneous edits. No user accounts / multi-store
    (kept intentionally simple for one shop).
  - Free JSONBin + Vercel Hobby limits are plenty for one small store.
==============================================================================
