"use strict";

function getJwtConfig() {
  const strJwtSecret = process.env.JWT_SECRET;
  const strJwtIssuer = process.env.JWT_ISSUER;
  const strJwtAudience = process.env.JWT_AUDIENCE;

  if (!strJwtSecret || Buffer.byteLength(strJwtSecret, "utf8") < 64) {
    throw new Error("JWT_SECRET must be configured and contain at least 64 UTF-8 bytes.");
  }
  if (!strJwtIssuer || !strJwtAudience) {
    throw new Error("JWT_ISSUER and JWT_AUDIENCE must be configured.");
  }

  return {
    strJwtSecret,
    strJwtIssuer,
    strJwtAudience
  };
}

module.exports = { getJwtConfig };
