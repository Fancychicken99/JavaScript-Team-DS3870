"use strict";
const objBcrypt = require("bcryptjs");
const objDatabase = require("../models");
async function fnCreateAdmin() {
  try {
    const strUsername = (process.env.ADMIN_USERNAME || "").trim();
    const strPassword = process.env.ADMIN_PASSWORD || "";
    if (strUsername.length < 3 || strUsername.length > 100 || strPassword.length < 12 || Buffer.byteLength(strPassword) > 72) throw new Error("Set ADMIN_USERNAME (3–100 characters) and ADMIN_PASSWORD (12+ characters, at most 72 UTF-8 bytes).");
    await objDatabase.User.create({ Username: strUsername, PasswordHash: await objBcrypt.hash(strPassword, 12), Role: objDatabase.UserRole.Admin });
    console.log("Administrator created. Clear ADMIN_PASSWORD from your environment.");
  } finally { await objDatabase.objSequelize.close(); }
}
fnCreateAdmin().catch((objError) => { console.error("Administrator creation failed:", objError.name); process.exitCode = 1; });
