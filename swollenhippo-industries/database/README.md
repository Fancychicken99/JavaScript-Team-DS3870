# MariaDB initialization and upgrades

Choose either the application's npm run db:sync command or these SQL scripts. Both preserve the existing Users and Jobs table/column names. The model maps intJobId to Id, strStatus to Status, and dteCreated to CreatedAt.

Connect to an existing MariaDB database with a migration account. In the MariaDB client, select the intended database and run the files in order (paths below assume the application directory):

~~~sql
SOURCE database/001-initialize.sql;
SOURCE database/002-upgrade-inquiries.sql;
~~~

001 creates missing tables without replacing existing ones. 002 adds missing inquiry/scheduling columns and the customer/date index; it can be run again without deleting data. Use a utf8mb4 database. Back up an existing deployment first. MariaDB schema changes commit implicitly; run one migration process at a time.

No credentials or default administrators are embedded in these scripts. Run npm run admin:create to create an administrator with a securely hashed password. Use a separate runtime account with SELECT, INSERT, UPDATE, and DELETE privileges after applying schema changes. Remote hosts may require MARIADB_SSL_CA; see the root README.

Live SQL execution remains an opt-in deployment check until a MariaDB database is connected. The optional npm run test:database command tests model create/read/update/delete in a rolled-back transaction against TEST_MARIADB_URL.

[MariaDB ALTER TABLE documentation](https://mariadb.com/docs/server/reference/sql-statements/data-definition/alter/alter-table)
