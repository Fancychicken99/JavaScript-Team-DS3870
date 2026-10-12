"use strict";
// Additive, repeatable upgrade: never sync with force or alter against existing data.
async function fnMigrate(objDatabase) {
  const objSequelize = objDatabase.objSequelize;
  try {
    await objSequelize.authenticate();
    await objSequelize.sync();
    const objQuery = objSequelize.getQueryInterface();
    const objColumns = await objQuery.describeTable("Jobs");
    for (const strName of ["strCustomerName", "strEmail", "strCompany", "strService", "strDetails", "dteExpectedCompletion"]) {
      if (!objColumns[strName]) await objQuery.addColumn("Jobs", strName, objDatabase.Job.rawAttributes[strName]);
    }
    console.log("MariaDB schema is ready; existing records were preserved.");
  } finally { await objSequelize.close(); }
}
module.exports = { fnMigrate };
if (require.main === module) fnMigrate(require("../models")).catch((objError) => { console.error("Migration failed:", objError.message); process.exitCode = 1; });
