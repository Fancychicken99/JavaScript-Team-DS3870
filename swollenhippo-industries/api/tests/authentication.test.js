"use strict";

const objAssert = require("node:assert/strict");
const { it: fnTest } = require("mocha");
const objJwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-only-secret-with-at-least-64-bytes-0123456789-abcdefghijklmnopqrstuvwxyz";
process.env.JWT_ISSUER = "SwollenHippo.Api";
process.env.JWT_AUDIENCE = "SwollenHippo.Client";

const fnAuthenticate = require("../middleware/authenticate");
const fnRequireRole = require("../middleware/requireRole");

function fnMakeResponse() {
  return {
    intStatus: null,
    objBody: null,
    status(intStatus) {
      this.intStatus = intStatus;
      return this;
    },
    json(objBody) {
      this.objBody = objBody;
      return this;
    }
  };
}

function fnMakeRequest(strToken) {
  return {
    objAuthenticatedUser: undefined,
    get(strHeader) {
      return strHeader === "authorization" ? `Bearer ${strToken}` : undefined;
    }
  };
}

function fnMakeToken(objClaims = {}) {
  return objJwt.sign(
    { username: "test-user", role: "Customer", ...objClaims },
    process.env.JWT_SECRET,
    {
      algorithm: "HS512",
      subject: "1",
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE,
      expiresIn: "2h"
    }
  );
}

fnTest("authentication accepts a correctly signed token and sets its claims", () => {
  const objRequest = fnMakeRequest(fnMakeToken());
  const objResponse = fnMakeResponse();
  let blnNextCalled = false;

  fnAuthenticate(objRequest, objResponse, (objError) => {
    objAssert.equal(objError, undefined);
    blnNextCalled = true;
  });

  objAssert.equal(blnNextCalled, true);
  objAssert.equal(objRequest.objAuthenticatedUser.sub, "1");
  objAssert.equal(objRequest.objAuthenticatedUser.role, "Customer");
});

fnTest("authentication rejects a token signed with another key", () => {
  const strToken = objJwt.sign({ role: "Admin" }, "different-secret", {
    algorithm: "HS512",
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE
  });
  const objResponse = fnMakeResponse();
  let blnNextCalled = false;

  fnAuthenticate(fnMakeRequest(strToken), objResponse, () => {
    blnNextCalled = true;
  });

  objAssert.equal(objResponse.intStatus, 401);
  objAssert.equal(blnNextCalled, false);
});

fnTest("authentication requires a bearer token", () => {
  const objResponse = fnMakeResponse();
  let blnNextCalled = false;
  fnAuthenticate({ get: () => undefined }, objResponse, () => {
    blnNextCalled = true;
  });

  objAssert.equal(objResponse.intStatus, 401);
  objAssert.equal(blnNextCalled, false);
});

fnTest("role middleware permits the matching role and denies other roles", () => {
  let blnNextCalled = false;
  const objNext = () => {
    blnNextCalled = true;
  };

  fnRequireRole("Customer")({ objAuthenticatedUser: { role: "Customer" } }, fnMakeResponse(), objNext);
  objAssert.equal(blnNextCalled, true);

  const objResponse = fnMakeResponse();
  blnNextCalled = false;
  fnRequireRole("Admin")({ objAuthenticatedUser: { role: "Customer" } }, objResponse, objNext);
  objAssert.equal(objResponse.intStatus, 403);
  objAssert.equal(blnNextCalled, false);
});
