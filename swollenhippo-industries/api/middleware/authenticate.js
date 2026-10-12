"use strict";
const objJwt = require("jsonwebtoken");
const { getJwtConfig: fnGetJwtConfig } = require("../config");
module.exports = function fnAuthenticate(objRequest, objResponse, fnNext) {
  const arrParts = (objRequest.get("authorization") || "").split(" ");
  if (arrParts.length !== 2 || arrParts[0] !== "Bearer") return objResponse.status(401).json({ message: "Please sign in." });
  const { strJwtSecret, strJwtIssuer, strJwtAudience } = fnGetJwtConfig();
  try {
    const objClaims = objJwt.verify(arrParts[1], strJwtSecret, { algorithms: ["HS512"], issuer: strJwtIssuer, audience: strJwtAudience });
    if (!Number.isSafeInteger(Number(objClaims.sub)) || Number(objClaims.sub) < 1) throw new objJwt.JsonWebTokenError("Invalid identity");
    objRequest.objAuthenticatedUser = objClaims;
  } catch (objError) {
    if (objError instanceof objJwt.JsonWebTokenError) return objResponse.status(401).json({ message: "Your session is invalid or expired. Please sign in again." });
    return fnNext(objError);
  }
  return fnNext();
};
