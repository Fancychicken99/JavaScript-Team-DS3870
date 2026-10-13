# Submission and verification record

## Recorded evidence

- Local release preparation (October 13, 2026): clean locked dependency installation completed with zero reported audit vulnerabilities; 27 syntax checks and all 33 API tests passed. The sandbox initially blocked localhost connections; tests passed when rerun with localhost access. Browser binaries were not reinstalled for documentation-only changes; five-browser evidence below is from the VM.
- VM transcript: 27 JavaScript syntax checks and 33 Mocha/Supertest tests passed.
- VM transcripts: Chromium, Firefox, WebKit, Chrome, and Edge each passed the browser workflow and nine automated accessibility page-state audits.
- VM transcript: MariaDB authentication succeeded.
- VM transcripts: Express and Nginx returned HTTP 200; public HTTPS returned 200; Certbot renewal dry run passed; systemd service restarted and reported active.
- User reports that the website and database work. Detailed live multi-account isolation and post-restart persistence results have not been supplied.

Do not describe isolated fixture tests as live database integration tests. `npm run test:database` remains an opt-in test against a separately provisioned disposable MariaDB database.

## Remaining evidence to collect

- [ ] Customer A can create and view a job; customer B cannot view it.
- [ ] Administrator updates status/date and edits a disposable inquiry; customer sees the update.
- [ ] Administrator deletes only the intended disposable job.
- [ ] Accounts and remaining jobs persist after Express restart.
- [ ] Keyboard-only interaction, screen-reader announcements, and 200%/400% zoom manually checked.
- [ ] Private off-VM database backup downloaded and restoration tested separately.
- [ ] Google Safe Browsing warning resolved or explicitly disclosed as unresolved.
- [ ] Reviewed deployment branch merged into Dev, then the team's submission branch.
- [ ] Team prompt history and each member's own reasons completed.
- [ ] Individual teammate evaluation forms completed by their actual authors.

## Deliverables

Submit a source ZIP from the final reviewed commit, the deployed URL, setup instructions in `DEPLOYMENT.md`, and test evidence. Keep screenshots separately if required. Exclude `.env`, database dumps, dependencies, browser caches, private keys, and editing backups. The ZIP should retain package-lock.json, SQL migrations, test scripts, and `.env.example`.

Team participation must reflect genuine work and review. Do not invent contributions or create commits merely to simulate equal participation. This document is an evidence checklist, not a claim that unchecked items have passed.
