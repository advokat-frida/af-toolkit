# SafeList

The fifth Toolkit tool: a send list checked against a suppression list, with a Keep/Remove
decision per match and a record. `README.md` says what it does; `../docs/design/DESIGN-SYSTEM.md`
governs how it looks.

Rules:

- Every matching rule, count, and record field lives in `src/core.js`. `src/app.js` renders and
  never reinterprets a result.
- "Safe" is never rendered as a status. Results say what was checked, against which file, dated.
- A suppression list older than `STALE_AFTER_HOURS` blocks the check. No override.
- Removed contacts enter the record as fingerprints only; kept contacts are named with their reason.
- No external requests, storage, or analytics. The build's CSP and net-kill wrapper enforce it.
- Sample data uses reserved `example.com` / `.org` / `.net` addresses only. Never a real domain.
- `chrome/` is maintained here. It began as a byte-exact copy of the family chrome (the website's
  standalone `/assets/` pages), which was deleted on 2026-09-10 with no source left; its footer
  follows the Toolkit shell footer (`../docs/design/DESIGN-SYSTEM.md` §7, the 2026-09-23 shared
  footer). The tab icon is read at build time from the shell's `../public/favicon-32.png`.
- Change the tool here, run `npm run check`, then the repository's gate before it is restaged.
