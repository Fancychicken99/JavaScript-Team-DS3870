# Frontend integration

The website uses the existing Express/MariaDB API and Bearer-token session helper. The revised header prominently displays the team's original logo on both pages. Bootstrap grids, bordered panels, paper marks, and earth-tone tokens provide the shared visual system; there are no CSS gradients, decorative glow, or animation-dependent interactions.

The team's dashboard-utils.js functions now power status counts, searching, and sorting. These apply to the current 50-record page, with that scope stated beside the controls. The helper tests run with the project's Mocha runner from api/tests/dashboard-utils.test.js; their relative import is corrected.

Customer accounts create inquiries and see only server-authorized jobs. Administrators can update status/completion dates, edit inquiry details, and delete jobs after a native confirmation. Native details/summary controls expose the inquiry editor to keyboard and assistive-technology users. Async feedback uses status regions; focus returns to the status region when edits or deletion replace the focused card.

Validation: npm run check, npm test, and npm run test:browser. Browser checks cover account creation, restored drafts, inquiry submission, search/filter/sort, status updates, keyboard inquiry editing, deletion cancellation/confirmation, focus recovery, and desktop/mobile accessibility. Live database and manual assistive-technology verification are separate release checks.
