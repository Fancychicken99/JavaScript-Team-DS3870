"use strict";

const objJwt = require("jsonwebtoken");
const { getJwtConfig } = require("../config");

function authenticate(req, res, next) {
  const strAuthorization = req.get("authorization") || "";
  const arrAuthorizationParts = strAuthorization.split(" ");
  if (arrAuthorizationParts.length !== 2 || arrAuthorizationParts[0] !== "Bearer") {
    return res.status(401).json({ message: "Authentication required." });
  }

  const { strJwtSecret, strJwtIssuer, strJwtAudience } = getJwtConfig();
  try {
    req.objAuthenticatedUser = objJwt.verify(arrAuthorizationParts[1], strJwtSecret, {
      algorithms: ["HS512"],
      issuer: strJwtIssuer,
      audience: strJwtAudience
    });
  } catch (error) {
    if (error instanceof objJwt.JsonWebTokenError || error instanceof objJwt.TokenExpiredError) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }
    return next(error);
  }

  return next();
}

module.exports = authenticate;
