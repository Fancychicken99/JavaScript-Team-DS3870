"use strict";
const objAssert = require("node:assert/strict");
const fnRequest = require("supertest");
const objJwt = require("jsonwebtoken");
const { fnCreateApp } = require("../../server");
const { fnTestEnvironment, fnTestDatabase } = require("./fixtures");
const objInquiry = { strCustomerName: "Customer", strEmail: "customer@example.com", strCompany: "Workshop", strService: "design", strDetails: "Build an enclosure." };
function fnToken(intId) {
  return objJwt.sign({}, process.env.JWT_SECRET, { algorithm: "HS512", subject: String(intId), issuer: process.env.JWT_ISSUER, audience: process.env.JWT_AUDIENCE, expiresIn: "2h" });
}
describe("Administrator inquiry editing and deletion", () => {
  let objDatabase; let objApp;
  beforeEach(async () => {
    fnTestEnvironment(); objDatabase = fnTestDatabase(); objApp = fnCreateApp(objDatabase);
    await objDatabase.Job.create({ ...objInquiry, AssignedUserId: 1, strStatus: "Pending", dteExpectedCompletion: null });
  });
  it("edits inquiry fields without accepting changes to ownership, status, or dates", async () => {
    const objResult = await fnRequest(objApp).patch("/api/jobs/1").auth(fnToken(2), { type: "bearer" }).send({ ...objInquiry,
      strDetails: "Revised enclosure dimensions.", AssignedUserId: 3, strStatus: "Shipped", dteExpectedCompletion: "2027-01-01" }).expect(200);
    objAssert.equal(objResult.body.strDetails, "Revised enclosure dimensions.");
    objAssert.equal(objResult.body.AssignedUserId, 1); objAssert.equal(objResult.body.strStatus, "Pending");
    objAssert.equal(objResult.body.dteExpectedCompletion, null);
    const objListing = await fnRequest(objApp).get("/api/jobs").auth(fnToken(1), { type: "bearer" }).expect(200);
    objAssert.equal(objListing.body[0].strDetails, "Revised enclosure dimensions.");
  });
  it("denies edit/delete to unauthenticated callers and customers, including the owner", async () => {
    for (const strMethod of ["patch", "delete"]) {
      await fnRequest(objApp)[strMethod]("/api/jobs/1").send(objInquiry).expect(401);
      for (const intUserId of [1, 3]) await fnRequest(objApp)[strMethod]("/api/jobs/1").auth(fnToken(intUserId), { type: "bearer" }).send(objInquiry).expect(403);
    }
    objAssert.equal(objDatabase.arrJobs.length, 1);
  });
  it("validates edits and job identifiers before changing records", async () => {
    for (const objBody of [{}, { ...objInquiry, strEmail: "invalid" }, { ...objInquiry, strDetails: "a".repeat(2001) }]) {
      await fnRequest(objApp).patch("/api/jobs/1").auth(fnToken(2), { type: "bearer" }).send(objBody).expect(400);
    }
    for (const strId of ["zero", "0", "-1", "1.5"]) {
      await fnRequest(objApp).delete("/api/jobs/" + strId).auth(fnToken(2), { type: "bearer" }).expect(400);
    }
    objAssert.equal(objDatabase.arrJobs[0].strDetails, objInquiry.strDetails);
  });
  it("returns 404 for missing edit/delete targets", async () => {
    await fnRequest(objApp).patch("/api/jobs/999").auth(fnToken(2), { type: "bearer" }).send(objInquiry).expect(404);
    await fnRequest(objApp).delete("/api/jobs/999").auth(fnToken(2), { type: "bearer" }).expect(404);
  });
  it("deletes the requested record and removes it from customer and admin listings", async () => {
    await objDatabase.Job.create({ ...objInquiry, AssignedUserId: 3, strStatus: "Pending" });
    await fnRequest(objApp).delete("/api/jobs/1").auth(fnToken(2), { type: "bearer" }).expect(200);
    const objCustomer = await fnRequest(objApp).get("/api/jobs").auth(fnToken(1), { type: "bearer" }).expect(200);
    const objAdmin = await fnRequest(objApp).get("/api/jobs").auth(fnToken(2), { type: "bearer" }).expect(200);
    objAssert.equal(objCustomer.body.length, 0); objAssert.equal(objAdmin.body.length, 1); objAssert.equal(objAdmin.body[0].intJobId, 2);
    await fnRequest(objApp).delete("/api/jobs/1").auth(fnToken(2), { type: "bearer" }).expect(404);
  });
  it("does not report successful deletion on database errors", async () => {
    objDatabase.arrJobs[0].destroy = async () => { throw new Error("private database failure"); };
    const objResult = await fnRequest(objApp).delete("/api/jobs/1").auth(fnToken(2), { type: "bearer" }).expect(500);
    objAssert.doesNotMatch(JSON.stringify(objResult.body), /private database failure/);
    objAssert.equal(objDatabase.arrJobs.length, 1);
  });
  it("revoking an administrator prevents inquiry editing and deletion immediately", async () => {
    const strToken = fnToken(2); objDatabase.arrUsers[1].Role = "Customer";
    await fnRequest(objApp).patch("/api/jobs/1").auth(strToken, { type: "bearer" }).send(objInquiry).expect(403);
    await fnRequest(objApp).delete("/api/jobs/1").auth(strToken, { type: "bearer" }).expect(403);
  });
});
