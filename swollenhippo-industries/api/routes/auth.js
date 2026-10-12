"use strict";

const express = require("express");
const objBcrypt = require("bcryptjs");
const objJwt = require("jsonwebtoken");
const { UniqueConstraintError } = require("sequelize");
const { getJwtConfig } = require("../config");
const { User, UserRole } = require("../../models");

const objRouter = express.Router();
const intMinimumPasswordLength = 12;
const intMaximumPasswordBytes = 72;
const intBcryptRounds = 12;

objRouter.post("/register", async (req, res, next) => {
  const { username, password } = req.body || {};
  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Username and password are required." });
  }

  const strUsername = username.trim();
  if (strUsername.length < 3 || strUsername.length > 100) {
    return res.status(400).json({ message: "Username must be between 3 and 100 characters." });
  }
  if (password.length < intMinimumPasswordLength ||
      Buffer.byteLength(password, "utf8") > intMaximumPasswordBytes) {
    return res.status(400).json({
      message: "Password must be at least 12 characters and no more than 72 UTF-8 bytes."
    });
  }

  try {
    const objUser = await User.create({
      Username: strUsername,
      PasswordHash: await objBcrypt.hash(password, intBcryptRounds),
      Role: UserRole.Customer
    });

    return res.status(201).json({
      message: "Account registered.",
      user: {
        id: objUser.Id,
        username: objUser.Username,
        role: objUser.Role
      }
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(400).json({ message: "That username is already registered." });
    }
    return next(error);
  }
});

objRouter.post("/login", async (req, res, next) => {
  const { username, password } = req.body || {};
  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Username and password are required." });
  }

  try {
    const objUser = await User.findOne({ where: { Username: username.trim() } });
    const blnPasswordTooLong = Buffer.byteLength(password, "utf8") > intMaximumPasswordBytes;
    if (!objUser || blnPasswordTooLong || !(await objBcrypt.compare(password, objUser.PasswordHash))) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const { strJwtSecret, strJwtIssuer, strJwtAudience } = getJwtConfig();
    const strAccessToken = objJwt.sign(
      {
        username: objUser.Username,
        role: objUser.Role
      },
      strJwtSecret,
      {
        algorithm: "HS512",
        subject: String(objUser.Id),
        issuer: strJwtIssuer,
        audience: strJwtAudience,
        expiresIn: "2h"
      }
    );

    return res.status(200).json({
      accessToken: strAccessToken,
      tokenType: "Bearer",
      expiresIn: 7200
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = objRouter;
