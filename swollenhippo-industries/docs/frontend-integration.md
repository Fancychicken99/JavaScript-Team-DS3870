# Frontend integration

Request: adapt the previous SwollenHippo frontend to the existing team's code.
Reason: preserve the authenticated MariaDB API and administrator workflow instead
of replacing them with the older fixture API. All variables follow Hungarian notation.

Updated dashboard.html and dashboard.js; added dashboard-utils.js and dashboard.css.
The separate stylesheet preserves existing, potentially unsaved style.css edits.
Home page, inquiries, session.js, database, auth routes, and job routes remain intact.

Uses GET /api/jobs?offset=N and the existing Bearer-token session helper.
Statuses: Pending, InProgress, Complete, Shipped. Records come from the database.
Administrators still save through PATCH /api/jobs/:id/status. Customers see
read-only records selected by server-side ownership checks.

Search, sorting, and counts apply to the current 50-record page. No invented
tracking numbers, update timestamps, or part specifications are displayed:
these fields are not provided by the existing schema.

Frontend ownership: public/dashboard.html, public/js/dashboard.js,
public/js/dashboard-utils.js, public/css/dashboard.css and tests/dashboard-utils.test.cjs.
Backend ownership remains api/, models/, and server integration.

Run node --test tests/dashboard-utils.test.cjs, npm run check, npm test and
npm run test:browser. Existing browser checks use the same heading, login,
inquiry, and administrator editing selectors. Check expanded project details
with a screen reader and mobile reflow before release.