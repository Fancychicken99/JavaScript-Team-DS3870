"use strict";
const objAssert = require("node:assert/strict");
const fnRequest = require("supertest");
const objJwt = require("jsonwebtoken");
const objBcrypt = require("bcryptjs");
const { fnTestEnvironment, fnTestDatabase } = require("./fixtures");
const { fnCreateApp } = require("../../server");
const objInquiry = { strCustomerName: "Test Customer", strEmail: "customer@example.com", strCompany: "Workshop", strService: "design", strDetails: "Build a prototype." };
function fnToken(intId, strRole = "Customer", objOptions = {}) {
  return objJwt.sign({ role: strRole }, process.env.JWT_SECRET, { algorithm: "HS512", subject: String(intId),
    issuer: process.env.JWT_ISSUER, audience: process.env.JWT_AUDIENCE, expiresIn: "2h", ...objOptions });
}
describe("Express application workflows (isolated database adapter)", function () {
  this.timeout(15000);
  let objApp; let objDatabase;
  beforeEach(() => { fnTestEnvironment(); objDatabase = fnTestDatabase(); objApp = fnCreateApp(objDatabase); });
  it("serves both pages, local Bootstrap, and the team logo with CSP", async () => {
    for (const strPath of ["/", "/dashboard.html", "/vendor/bootstrap.min.css", "/Swollenhippo_logo.png"]) {
      const objResult = await fnRequest(objApp).get(strPath).expect(200);
      objAssert.match(objResult.headers["content-security-policy"], /default-src 'self'/);
      objAssert.equal(objResult.headers["x-powered-by"], undefined);
    }
  });
  it("registers customers with hashed passwords and rejects role escalation", async () => {
    const objResult = await fnRequest(objApp).post("/api/auth/register").send({ username: "new-customer", password: "correct-long-password", Role: "Admin", role: "Admin" }).expect(201);
    objAssert.equal(objResult.body.user.role, "Customer");
    objAssert.ok(await objBcrypt.compare("correct-long-password", objDatabase.arrUsers[3].PasswordHash));
    objAssert.equal(objResult.body.user.PasswordHash, undefined);
  });
  it("rejects duplicate accounts and short passwords", async () => {
    await fnRequest(objApp).post("/api/auth/register").send({ username: "customer", password: "correct-long-password" }).expect(409);
    await fnRequest(objApp).post("/api/auth/register").send({ username: "new-user", password: "short" }).expect(400);
  });
  it("logs in and rejects wrong or unknown credentials", async () => {
    const objResult = await fnRequest(objApp).post("/api/auth/login").send({ username: "customer", password: "customer-password" }).expect(200);
    objAssert.equal(objJwt.verify(objResult.body.accessToken, process.env.JWT_SECRET).sub, "1");
    await fnRequest(objApp).post("/api/auth/login").send({ username: "customer", password: "wrong-password" }).expect(401);
    await fnRequest(objApp).post("/api/auth/login").send({ username: "missing", password: "wrong-password" }).expect(401);
  });
  it("creates pending inquiries linked to the signed-in customer, ignoring forged ownership and status", async () => {
    const objResult = await fnRequest(objApp).post("/api/jobs").auth(fnToken(1), { type: "bearer" }).send({ ...objInquiry, AssignedUserId: 3, strStatus: "Shipped", dteExpectedCompletion: "2027-01-01" }).expect(201);
    objAssert.equal(objResult.body.AssignedUserId, 1); objAssert.equal(objResult.body.strStatus, "Pending");
    objAssert.equal(objResult.body.dteExpectedCompletion, null); objAssert.equal(objDatabase.arrJobs.length, 1);
  });
  it("rejects missing authentication and expired or forged tokens", async () => {
    await fnRequest(objApp).post("/api/jobs").send(objInquiry).expect(401);
    for (const strToken of [fnToken(1, "Customer", { expiresIn: -1 }), "forged-token"]) await fnRequest(objApp).get("/api/jobs").auth(strToken, { type: "bearer" }).expect(401);
  });
  it("rejects invalid inquiry input without storing anything", async () => {
    for (const objInvalid of [{ strDetails: " " }, { strEmail: "invalid" }, { strCustomerName: "a".repeat(101) }, { strService: "unknown" }, { strCompany: {} }]) {
      await fnRequest(objApp).post("/api/jobs").auth(fnToken(1), { type: "bearer" }).send({ ...objInquiry, ...objInvalid }).expect(400);
    }
    objAssert.equal(objDatabase.arrJobs.length, 0);
  });
  it("isolates customer listings while administrators can see all jobs", async () => {
    await objDatabase.Job.create({ ...objInquiry, AssignedUserId: 1 }); await objDatabase.Job.create({ ...objInquiry, AssignedUserId: 3 });
    const objCustomerResult = await fnRequest(objApp).get("/api/jobs/my-jobs?AssignedUserId=3").auth(fnToken(1), { type: "bearer" }).expect(200);
    objAssert.equal(objCustomerResult.body.length, 1); objAssert.equal(objCustomerResult.body[0].AssignedUserId, 1);
    const objAdminResult = await fnRequest(objApp).get("/api/jobs").auth(fnToken(2, "Admin"), { type: "bearer" }).expect(200);
    objAssert.equal(objAdminResult.body.length, 2);
  });
  it("paginates lists and validates pagination", async () => {
    for (let intIndex = 0; intIndex < 51; intIndex++) await objDatabase.Job.create({ ...objInquiry, AssignedUserId: 1 });
    const objFirst = await fnRequest(objApp).get("/api/jobs").auth(fnToken(1), { type: "bearer" }).expect(200);
    const objSecond = await fnRequest(objApp).get("/api/jobs?offset=50").auth(fnToken(1), { type: "bearer" }).expect(200);
    objAssert.equal(objFirst.body.length, 50); objAssert.equal(objSecond.body.length, 1);
    await fnRequest(objApp).get("/api/jobs?offset=-1").auth(fnToken(1), { type: "bearer" }).expect(400);
  });
  it("only administrators can update status and expected completion", async () => {
    await objDatabase.Job.create({ ...objInquiry, AssignedUserId: 1, strStatus: "Pending" });
    await fnRequest(objApp).patch("/api/jobs/1/status").auth(fnToken(1), { type: "bearer" }).send({ strStatus: "Complete" }).expect(403);
    const objResult = await fnRequest(objApp).patch("/api/jobs/1/status").auth(fnToken(2, "Admin"), { type: "bearer" }).send({ strStatus: "InProgress", dteExpectedCompletion: "2026-10-20" }).expect(200);
    objAssert.equal(objResult.body.strStatus, "InProgress"); objAssert.equal(objDatabase.arrJobs[0].dteExpectedCompletion, "2026-10-20");
    await fnRequest(objApp).patch("/api/jobs/1/status").auth(fnToken(2, "Admin"), { type: "bearer" }).send({ strStatus: "Complete", dteExpectedCompletion: null }).expect(200);
    objAssert.equal(objDatabase.arrJobs[0].dteExpectedCompletion, null);
  });
  it("rejects invalid statuses, impossible dates, and missing jobs", async () => {
    await objDatabase.Job.create({ ...objInquiry, AssignedUserId: 1 });
    for (const objInvalid of [{ strStatus: "Unknown" }, { strStatus: "Pending", dteExpectedCompletion: "2026-02-30" }, { strStatus: "Pending", dteExpectedCompletion: "0000-01-01" }]) {
      await fnRequest(objApp).patch("/api/jobs/1/status").auth(fnToken(2, "Admin"), { type: "bearer" }).send(objInvalid).expect(400);
    }
    await fnRequest(objApp).patch("/api/jobs/999/status").auth(fnToken(2, "Admin"), { type: "bearer" }).send({ strStatus: "Complete" }).expect(404);
  });
  it("immediately respects revoked admin roles and deleted users", async () => {
    objDatabase.arrUsers[1].Role = "Customer";
    await fnRequest(objApp).patch("/api/jobs/1/status").auth(fnToken(2, "Admin"), { type: "bearer" }).send({ strStatus: "Complete" }).expect(403);
    await fnRequest(objApp).get("/api/jobs").auth(fnToken(99), { type: "bearer" }).expect(401);
  });
  it("returns safe JSON for malformed, oversized, and unknown requests", async () => {
    await fnRequest(objApp).post("/api/jobs").set("Content-Type", "application/json").send("{").expect(400);
    await fnRequest(objApp).post("/api/jobs").send({ strDetails: "a".repeat(20000) }).expect(413);
    await fnRequest(objApp).get("/api/missing").expect(404);
  });
  it("does not claim an inquiry was saved when persistence fails", async () => {
    objDatabase.Job.create = async () => { throw new Error("private connection details"); };
    const objResult = await fnRequest(objApp).post("/api/jobs").auth(fnToken(1), { type: "bearer" }).send(objInquiry).expect(500);
    objAssert.doesNotMatch(JSON.stringify(objResult.body), /private connection/);
  });
  it("rate limits account endpoints", async () => {
    for (let intIndex = 0; intIndex < 50; intIndex++) await fnRequest(objApp).post("/api/auth/login").send({}).expect(400);
    await fnRequest(objApp).post("/api/auth/login").send({}).expect(429);
  });
});
