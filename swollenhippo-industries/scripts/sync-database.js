"use strict";

const { objSequelize } = require("../models");

async function syncDatabase() {
  try {
    await objSequelize.authenticate();
    await objSequelize.sync();
    console.log("MariaDB schema is ready.");
  } catch (error) {
    console.error("Failed to initialize the MariaDB schema:", error);
    process.exitCode = 1;
  } finally {
    await objSequelize.close();
  }
}

syncDatabase();
