"use strict";
const objExpress = require("express");
const objBcrypt = require("bcryptjs");
const objJwt = require("jsonwebtoken");
const { UniqueConstraintError: clsUniqueConstraintError } = require("sequelize");
const { getJwtConfig: fnGetJwtConfig } = require("../config");
const strDummyHash = objBcrypt.hashSync("unused-dummy-password", 12);
module.exports = (objDatabase) => {
  const objRouter = objExpress.Router();
  objRouter.post("/register", async (objRequest, objResponse) => {
    const { username: strInputUsername, password: strPassword } = objRequest.body || {};
    const strUsername = typeof strInputUsername === "string" ? strInputUsername.trim() : "";
    if (strUsername.length < 3 || strUsername.length > 100 || typeof strPassword !== "string" ||
      strPassword.length < 12 || Buffer.byteLength(strPassword, "utf8") > 72) {
      return objResponse.status(400).json({ message: "Use a username of 3–100 characters and a password of at least 12 characters (maximum 72 UTF-8 bytes)." });
    }
    try {
      const objUser = await objDatabase.User.create({ Username: strUsername,
        PasswordHash: await objBcrypt.hash(strPassword, 12), Role: objDatabase.UserRole.Customer });
      return objResponse.status(201).json({ message: "Account created. Please sign in.", user: { id: objUser.Id, username: objUser.Username, role: objUser.Role } });
    } catch (objError) {
      if (objError instanceof clsUniqueConstraintError) return objResponse.status(409).json({ message: "That username is unavailable." });
      throw objError;
    }
  });
  objRouter.post("/login", async (objRequest, objResponse) => {
    const { username: strUsername, password: strPassword } = objRequest.body || {};
    if (typeof strUsername !== "string" || typeof strPassword !== "string" || strUsername.length > 100 || Buffer.byteLength(strPassword, "utf8") > 72) {
      return objResponse.status(400).json({ message: "Provide a valid username and password." });
    }
    const objUser = await objDatabase.User.findOne({ where: { Username: strUsername.trim() } });
    const blnMatches = await objBcrypt.compare(strPassword, objUser ? objUser.PasswordHash : strDummyHash);
    if (!objUser || !blnMatches) return objResponse.status(401).json({ message: "Invalid credentials." });
    const { strJwtSecret, strJwtIssuer, strJwtAudience } = fnGetJwtConfig();
    const strToken = objJwt.sign({ username: objUser.Username, role: objUser.Role }, strJwtSecret,
      { algorithm: "HS512", subject: String(objUser.Id), issuer: strJwtIssuer, audience: strJwtAudience, expiresIn: "2h" });
    return objResponse.json({ accessToken: strToken, tokenType: "Bearer", expiresIn: 7200,
      user: { username: objUser.Username, role: objUser.Role } });
  });
  return objRouter;
};
