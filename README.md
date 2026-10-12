# SwollenHippo Industries

A Node.js/Express application for customer project inquiries, private job tracking, and administrator status updates. Bootstrap is served locally with earth-tone styles and the team's logo. MariaDB is the only application database; test adapters are confined to the test suite.

## Requirements and local setup

Install Node.js 22.12 or newer (with npm) and connect to an existing MariaDB database. The server intentionally requires a real database connection; tests run without one.

Run from the application directory:

~~~powershell
cd swollenhippo-industries
npm ci
Copy-Item .env.example .env
node -e "console.log(require('node:crypto').randomBytes(64).toString('hex'))"
~~~

Edit .env locally. Set MARIADB_URL to your database connection URL and JWT_SECRET to the generated random value. Keep JWT_ISSUER and JWT_AUDIENCE consistent. Do not commit .env, real credentials, or the generated secret. Percent-encode reserved characters in URL usernames/passwords. For remote MariaDB with TLS, set MARIADB_SSL_CA to the provider's PEM CA file; certificate verification stays enabled.

The database must already exist. Its deployment administrator should create it with utf8mb4 encoding and provide a migration account allowed to CREATE, ALTER, INDEX, and REFERENCES as well as read/write tables. Use a more restricted runtime account after migration.

~~~powershell
npm run db:sync
npm start
~~~

Open http://127.0.0.1:3000. Start commands load .env automatically. Connection pooling uses up to 10 connections, with a 30-second acquisition timeout. Startup fails clearly when database or JWT settings are unavailable.

## Administrator setup

Create an administrator through the trusted local terminal; there is no public administrator registration. This command creates a new account and never silently promotes or overwrites an existing account.

~~~powershell
$env:ADMIN_USERNAME = 'your-admin-name'
$objPassword = Read-Host 'Administrator password' -AsSecureString
$env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', $objPassword).Password
npm run admin:create
Remove-Item Env:ADMIN_PASSWORD
Remove-Item Env:ADMIN_USERNAME
~~~

Use a password of at least 12 characters and at most 72 UTF-8 bytes. Sign in through the dashboard. Customers use Create customer account and then Sign in. Customer inquiries start Pending with no promised completion date; administrators set the schedule after review.

## Database schema and upgrades

The models retain the existing physical Users and Jobs table names to preserve compatibility with the team's database. Job API/model attributes intJobId, strStatus, and dteCreated map to the existing Id, Status, and CreatedAt columns. Jobs also stores strCustomerName, strEmail, strCompany, strService, strDetails, dteExpectedCompletion, Title, and AssignedUserId. Users stores unique Username, PasswordHash, and Role. Passwords use bcrypt with cost 12.

npm run db:sync creates missing tables and adds missing inquiry/date columns to existing Jobs tables. It is repeatable, does not drop tables, and does not use force or alter synchronization. Back up a deployed database first, and run one migration process at a time. Existing jobs retain their status and ownership; newly added fields use blank/default values where historical details were unavailable. Existing unassigned jobs remain visible to administrators.

## Verification

~~~powershell
npm run check
npm test
npx playwright install chromium
npm run test:browser
npm audit
~~~

Mocha/Supertest tests exercise actual Express endpoints using an isolated database adapter. Browser tests run the real frontend and Express routes, checking registration, login, draft restoration, inquiry saving, customer tracking, administrator updates, input escaping, keyboard skip navigation, 320-pixel reflow, and axe WCAG checks. Screenshots are written to ignored test-results. No test credentials are used by production code.

Live MariaDB verification is separate and opt-in. First apply the schema to a disposable database, then set TEST_MARIADB_URL to that database and run npm run test:database. This tests real driver/model create/read/update operations inside a rolled-back transaction. The current implementation was developed without an active database supplied, so live database connectivity and migration execution must be verified when one is configured.

Automated accessibility checks are evidence, not certification of full WCAG 2.2 compliance. Before submission, manually check every interaction using only a keyboard, screen-reader labels/announcements, focus after errors and navigation, 200%/400% zoom, and browser/password-manager behavior. The original team logo is preserved as supplied.

## Deployment

Set NODE_ENV=production, provide database and JWT configuration through the host's secret management, and serve through HTTPS. The default bind address is 127.0.0.1; set HOST=0.0.0.0 only when the deployment requires it. Do not expose MariaDB publicly. This is a single-process application with in-memory rate-limit counters; multiple instances require a shared rate-limit store. Proxy headers are not trusted by default, so a reverse proxy may cause all clients to share a rate-limit bucket until a trusted-proxy configuration is deliberately added.

The browser keeps the bearer token in sessionStorage for the current tab; it is not persisted in localStorage. Signing out clears the browser token. Tokens expire after two hours; there is no server-side per-token logout revocation or password-reset flow. Account deletion/role changes are rechecked from the database on protected requests. Keep HTTPS and the restrictive content security policy in place.

## Submission items outside the application

Merge/review the final work into the team's submission branch, preserve each teammate's authentic commits, collect original prompts and the team's own explanations, and complete the individual evaluation form. Prompt history from other teammates and earlier chats is not reconstructed here.

See swollenhippo-industries/api/README.md for the request/response contract.

Implementation references: [Express security guidance](https://expressjs.com/en/advanced/best-practice-security/), [Sequelize migrations](https://sequelize.org/docs/v6/other-topics/migrations/), and [Bootstrap accessibility](https://getbootstrap.com/docs/5.3/getting-started/accessibility/).
