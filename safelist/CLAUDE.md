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
- `chrome/` is copied byte-exact from the family; re-copy, never hand-edit.
- Change the tool here, run `npm run check`, then the repository's gate before it is restaged.
