"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const objJwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-only-secret-with-at-least-64-bytes-0123456789-abcdefghijklmnopqrstuvwxyz";
process.env.JWT_ISSUER = "SwollenHippo.Api";
process.env.JWT_AUDIENCE = "SwollenHippo.Client";

const authenticate = require("../middleware/authenticate");
const requireRole = require("../middleware/requireRole");

function makeResponse() {
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

function makeRequest(strToken) {
  return {
    objAuthenticatedUser: undefined,
    get(strHeader) {
      return strHeader === "authorization" ? `Bearer ${strToken}` : undefined;
    }
  };
}

function makeToken(objClaims = {}) {
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

test("authentication accepts a correctly signed token and sets its claims", () => {
  const req = makeRequest(makeToken());
  const res = makeResponse();
  let blnNextCalled = false;

  authenticate(req, res, (error) => {
    assert.equal(error, undefined);
    blnNextCalled = true;
  });

  assert.equal(blnNextCalled, true);
  assert.equal(req.objAuthenticatedUser.sub, "1");
  assert.equal(req.objAuthenticatedUser.role, "Customer");
});

test("authentication rejects a token signed with another key", () => {
  const strToken = objJwt.sign({ role: "Admin" }, "different-secret", {
    algorithm: "HS512",
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE
  });
  const res = makeResponse();
  let blnNextCalled = false;

  authenticate(makeRequest(strToken), res, () => {
    blnNextCalled = true;
  });

  assert.equal(res.intStatus, 401);
  assert.equal(blnNextCalled, false);
});

test("authentication requires a bearer token", () => {
  const res = makeResponse();
  let blnNextCalled = false;
  authenticate({ get: () => undefined }, res, () => {
    blnNextCalled = true;
  });

  assert.equal(res.intStatus, 401);
  assert.equal(blnNextCalled, false);
});

test("role middleware permits the matching role and denies other roles", () => {
  let blnNextCalled = false;
  const objNext = () => {
    blnNextCalled = true;
  };

  requireRole("Customer")({ objAuthenticatedUser: { role: "Customer" } }, makeResponse(), objNext);
  assert.equal(blnNextCalled, true);

  const res = makeResponse();
  requireRole("Admin")({ objAuthenticatedUser: { role: "Customer" } }, res, objNext);
  assert.equal(res.intStatus, 403);
});
