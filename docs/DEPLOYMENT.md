# Deployment and operations

Public URL: https://swollenhippopotamusindustries.duckdns.org/

The team deployed to Debian 13 on Google Compute Engine. Nginx terminates HTTPS and forwards requests to Express at 127.0.0.1:3000. Express connects to local MariaDB. The Node process runs as the restricted `swollenhippo` Linux account through systemd. This is a single-server deployment, not a high-availability service.

## Reproduce the deployment

1. Install Node.js 22.12 or newer, Git, Nginx, and MariaDB. Install Certbot through Snap. Clone the reviewed submission branch into `/opt/swollenhippo`.
2. From `/opt/swollenhippo/swollenhippo-industries`, run `npm ci`, `npm run check`, and `npm test`.
3. Create a MariaDB database named `swollenhippo` using utf8mb4. Create a separate runtime account at `127.0.0.1` with SELECT, INSERT, UPDATE, and DELETE privileges on this database only. Generate a unique password locally; do not use example passwords.
4. Apply `database/001-initialize.sql` and `database/002-upgrade-inquiries.sql` as a migration administrator, against that database. Do not run migrations with the restricted runtime account.
5. Copy `.env.example` to `.env`. Configure the real database URL, a random JWT secret of at least 64 bytes, `NODE_ENV=production`, `HOST=127.0.0.1`, and `PORT=3000`. Never commit this file or its backups.
6. Create the administrator using `scripts/create-admin.js` and temporary ADMIN_USERNAME/ADMIN_PASSWORD environment variables. Use a unique password of at least 12 characters; clear those variables afterward. No public administrator registration exists.
7. Create the `swollenhippo` system user with no interactive login. Make the code root-owned and `.env` owned by `root:swollenhippo` with mode 640. Ensure directories and code are readable by the service account.
8. Install `deploy/swollenhippo.service` into `/etc/systemd/system/`. Verify its Node executable path with `command -v node`. Run `sudo systemctl daemon-reload` and `sudo systemctl enable --now swollenhippo`.
9. Install `deploy/nginx.conf` as `/etc/nginx/sites-available/swollenhippo`, link it in `sites-enabled`, run `sudo /usr/sbin/nginx -t`, and reload Nginx only after validation succeeds. This template is for initial setup: do not overwrite a working Certbot-managed HTTPS configuration with it.
10. Point DuckDNS at the VM's current external IP and allow inbound TCP 80/443. Do not publicly expose 3000 or 3306. Keep required SSH access restricted according to the team's cloud policy.
11. Run `sudo snap run certbot --nginx --redirect -d swollenhippopotamusindustries.duckdns.org`, then `sudo snap run certbot renew --dry-run`.
12. Check the real customer/admin workflow and persistence as described in `SUBMISSION.md`.

Express trusts loopback proxies only. Nginx overwrites X-Forwarded-For with the actual connecting address. Reassess both settings if adding a load balancer or moving the proxy to another machine.

## Browser verification

Use `npm ci` with development dependencies. Install only the targets needed on the test machine:

```bash
npx playwright install-deps chromium firefox webkit
npx playwright install chromium firefox webkit
npx playwright install chrome msedge
TEST_BROWSER=chromium npm run test:browser
TEST_BROWSER=firefox npm run test:browser
TEST_BROWSER=webkit npm run test:browser
TEST_BROWSER=chrome npm run test:browser
TEST_BROWSER=edge npm run test:browser
```

In PowerShell set `$env:TEST_BROWSER = 'firefox'` and run `npm run test:browser`. The script defaults to Chromium and uses isolated fixtures, not production accounts or MariaDB. Screenshots are saved in `test-results/<browser>`. WebKit is not actual Safari on an Apple device. Automated axe checks do not certify complete WCAG conformance.

The approximately 1 GB VM stalled during browser installation. Installation completed after adding 2 GB temporary swap; memory pressure was suspected but not conclusively established. Run future browser checks on a development machine or CI where practical. Temporary swap does not survive reboot unless explicitly configured. Never delete an active swap file, and check memory capacity before disabling swap.

## Operations

```bash
sudo systemctl status swollenhippo --no-pager
sudo journalctl -u swollenhippo -n 60 --no-pager
curl -I http://127.0.0.1:3000/
curl -I https://swollenhippopotamusindustries.duckdns.org/
df -h /
free -h
```

Before an update, preserve the current commit identifier and back up MariaDB. Deploy only reviewed commits, preserve `.env`, install locked dependencies, apply required migrations with a privileged migration account, and restart the service. Verify the live workflow afterward. Do not blindly pull over uncommitted VM changes. Code rollback does not automatically reverse schema changes.

Create a private backup from the VM:

```bash
(
  set -eu
  umask 077
  sudo mariadb-dump --single-transaction swollenhippo > "$HOME/swollenhippo-backup-$(date +%Y%m%d-%H%M%S).sql"
)
```

Transfer backups off the VM to restricted storage. Assign a teammate to schedule backups and verify restoration into a separate disposable database. SQL dumps contain sensitive records and password hashes. Do not commit them. Monitor disk usage, renewals, and security updates. Confirm DuckDNS after VM external-IP changes.

## Unresolved Google Safe Browsing warning

The user supplied a Safe Browsing result marking some pages unsafe. Search Console ownership was verified, but the user reported no Security Issues there. Warning removal has not been verified. This is a release concern independent of valid HTTPS and passing functional tests. Follow up on the Google review, inspect any flagged URLs, and do not instruct visitors to bypass protection. Keep the Google verification HTML on the VM; it is not included in the source archive.

References: [Express proxies](https://expressjs.com/en/guide/behind-proxies.html), [Playwright browsers](https://playwright.dev/docs/browsers), [Certbot](https://certbot.eff.org/), [Search Console security issues](https://support.google.com/webmasters/answer/9044101).
