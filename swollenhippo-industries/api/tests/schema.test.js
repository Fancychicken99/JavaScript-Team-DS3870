"use strict";
const objAssert = require("node:assert/strict");
const { Sequelize: clsSequelize, DataTypes: objDataTypes } = require("sequelize");
const { fnMigrate } = require("../../scripts/sync-database");
describe("MariaDB schema and additive upgrades", () => {
  it("maps required job attributes to MariaDB types and keeps legacy records compatible", async () => {
    const objSequelize = new clsSequelize("mariadb://test:test@127.0.0.1:3306/test", { logging: false });
    try {
      const objUser = require("../../models/User")(objSequelize, objDataTypes);
      const objJob = require("../../models/Job")(objSequelize, objDataTypes);
      objAssert.equal(objUser.rawAttributes.PasswordHash.allowNull, false);
      objAssert.equal(objJob.rawAttributes.intJobId.field, "Id");
      objAssert.equal(objJob.rawAttributes.strStatus.field, "Status");
      objAssert.equal(objJob.rawAttributes.dteCreated.field, "CreatedAt");
      objAssert.equal(objJob.rawAttributes.dteExpectedCompletion.type.key, "DATEONLY");
      objAssert.deepEqual(objJob.rawAttributes.strStatus.values, ["Pending", "InProgress", "Complete", "Shipped"]);
      for (const strName of ["strCustomerName", "strDetails", "strEmail"]) objAssert.equal(objJob.rawAttributes[strName].allowNull, false);
      await objJob.build({ Title: "Prototype", strCustomerName: "Customer", strDetails: "Details" }).validate();
    } finally { await objSequelize.close(); }
  });
  it("adds missing columns once without forcing or altering existing tables", async () => {
    const objColumns = { Id: {}, Title: {}, Status: {}, CreatedAt: {}, AssignedUserId: {} };
    const arrAdded = []; let intClosed = 0;
    const objDatabase = {
      Job: { rawAttributes: Object.fromEntries(["strCustomerName", "strEmail", "strCompany", "strService", "strDetails", "dteExpectedCompletion"].map((strName) => [strName, { type: "test" }])) },
      objSequelize: {
        async authenticate() {}, async sync(objOptions) { objAssert.equal(objOptions, undefined); }, async close() { intClosed++; },
        getQueryInterface() { return {
          async describeTable(strTable) { objAssert.equal(strTable, "Jobs"); return objColumns; },
          async addColumn(strTable, strName) { arrAdded.push(strName); objColumns[strName] = {}; }
        }; }
      }
    };
    await fnMigrate(objDatabase); await fnMigrate(objDatabase);
    objAssert.equal(arrAdded.length, 6); objAssert.equal(intClosed, 2);
  });
  it("closes the connection and surfaces migration failures", async () => {
    let blnClosed = false;
    await objAssert.rejects(fnMigrate({ objSequelize: { async authenticate() { throw new Error("offline"); }, async close() { blnClosed = true; } } }), /offline/);
    objAssert.equal(blnClosed, true);
  });
});
