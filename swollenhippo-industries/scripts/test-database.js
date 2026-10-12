"use strict";
// Explicit opt-in against a disposable database; DML is rolled back.
const objAssert = require("node:assert/strict");
const objCrypto = require("node:crypto");
async function fnTestDatabase() {
  if (!process.env.TEST_MARIADB_URL) throw new Error("Set TEST_MARIADB_URL to a disposable MariaDB database with the migrated schema.");
  process.env.MARIADB_URL = process.env.TEST_MARIADB_URL;
  const objDatabase = require("../models");
  let objTransaction;
  try {
    await objDatabase.objSequelize.authenticate();
    objTransaction = await objDatabase.objSequelize.transaction();
    const objUser = await objDatabase.User.create({ Username: "integration-" + objCrypto.randomUUID(), PasswordHash: "unused-test-hash", Role: "Customer" }, { transaction: objTransaction });
    const objJob = await objDatabase.Job.create({ Title: "Database test", strCustomerName: "Test customer", strDetails: "Rollback test", AssignedUserId: objUser.Id }, { transaction: objTransaction });
    objAssert.equal(objJob.strStatus, "Pending");
    await objJob.update({ strStatus: "InProgress", dteExpectedCompletion: "2026-10-20" }, { transaction: objTransaction });
    const objReloaded = await objDatabase.Job.findByPk(objJob.intJobId, { transaction: objTransaction });
    objAssert.equal(objReloaded.dteExpectedCompletion, "2026-10-20"); objAssert.equal(objReloaded.AssignedUserId, objUser.Id);
    console.log("Live MariaDB create/read/update passed; test records will be rolled back.");
  } finally { if (objTransaction) await objTransaction.rollback(); await objDatabase.objSequelize.close(); }
}
fnTestDatabase().catch((objError) => { console.error(objError.message); process.exitCode = 1; });
