"use strict";
const objExpress = require("express");
const fnAuthenticate = require("../middleware/authenticate");
const fnRequireRole = require("../middleware/requireRole");
const { fnValidInquiry, fnInquiryValues } = require("../job-input");
function fnValidDate(strDate) {
  return typeof strDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(strDate) &&
    Number(strDate.slice(0, 4)) >= 1000 && Number.isFinite(Date.parse(strDate)) && new Date(strDate).toISOString().slice(0, 10) === strDate;
}
module.exports = (objDatabase) => {
  const objRouter = objExpress.Router();
  objRouter.use(fnAuthenticate);
  // Recheck the database so deleted accounts and revoked admin roles take effect immediately.
  objRouter.use(async (objRequest, objResponse, fnNext) => {
    const objUser = await objDatabase.User.findByPk(Number(objRequest.objAuthenticatedUser.sub));
    if (!objUser) return objResponse.status(401).json({ message: "Account unavailable. Please sign in again." });
    objRequest.objAuthenticatedUser.role = objUser.Role;
    fnNext();
  });
  objRouter.post("/", fnRequireRole(objDatabase.UserRole.Customer), async (objRequest, objResponse) => {
    const objBody = objRequest.body || {};
    if (!fnValidInquiry(objBody)) {
      return objResponse.status(400).json({ message: "Provide your name, a valid email, service, and project details within the displayed limits." });
    }
    const objJob = await objDatabase.Job.create({
      ...fnInquiryValues(objBody),
      strStatus: objDatabase.JobStatus.Pending, dteExpectedCompletion: null,
      AssignedUserId: Number(objRequest.objAuthenticatedUser.sub)
    });
    return objResponse.status(201).json(objJob);
  });
  objRouter.get(["/", "/my-jobs"], async (objRequest, objResponse) => {
    const intLimit = 50;
    const intOffset = Number(objRequest.query.offset || 0);
    if (!Number.isSafeInteger(intOffset) || intOffset < 0) return objResponse.status(400).json({ message: "Invalid page offset." });
    const objWhere = objRequest.objAuthenticatedUser.role === objDatabase.UserRole.Admin ? {} : { AssignedUserId: Number(objRequest.objAuthenticatedUser.sub) };
    return objResponse.json(await objDatabase.Job.findAll({ where: objWhere, order: [["dteCreated", "DESC"], ["intJobId", "DESC"]], limit: intLimit, offset: intOffset }));
  });
  objRouter.patch("/:id/status", fnRequireRole(objDatabase.UserRole.Admin), async (objRequest, objResponse) => {
    const intJobId = Number(objRequest.params.id);
    const { strStatus, dteExpectedCompletion } = objRequest.body || {};
    if (!Number.isSafeInteger(intJobId) || intJobId < 1 || !Object.values(objDatabase.JobStatus).includes(strStatus) ||
      (dteExpectedCompletion !== undefined && dteExpectedCompletion !== null && !fnValidDate(dteExpectedCompletion))) {
      return objResponse.status(400).json({ message: "Choose a valid job status and a valid completion date (YYYY-MM-DD), or leave the date empty." });
    }
    const objJob = await objDatabase.Job.findByPk(intJobId);
    if (!objJob) return objResponse.status(404).json({ message: "Job not found." });
    objJob.strStatus = strStatus;
    if (dteExpectedCompletion !== undefined) objJob.dteExpectedCompletion = dteExpectedCompletion;
    await objJob.save();
    return objResponse.json(objJob);
  });
  objRouter.patch("/:id", fnRequireRole(objDatabase.UserRole.Admin), async (objRequest, objResponse) => {
    const intJobId = Number(objRequest.params.id);
    const objBody = objRequest.body || {};
    if (!Number.isSafeInteger(intJobId) || intJobId < 1 || !fnValidInquiry(objBody)) {
      return objResponse.status(400).json({ message: "Provide a valid job ID and complete inquiry details within the displayed limits." });
    }
    const objJob = await objDatabase.Job.findByPk(intJobId);
    if (!objJob) return objResponse.status(404).json({ message: "Job not found." });
    Object.assign(objJob, fnInquiryValues(objBody));
    await objJob.save();
    return objResponse.json(objJob);
  });
  objRouter.delete("/:id", fnRequireRole(objDatabase.UserRole.Admin), async (objRequest, objResponse) => {
    const intJobId = Number(objRequest.params.id);
    if (!Number.isSafeInteger(intJobId) || intJobId < 1) {
      return objResponse.status(400).json({ message: "Job ID must be a positive integer." });
    }
    const objJob = await objDatabase.Job.findByPk(intJobId);
    if (!objJob) return objResponse.status(404).json({ message: "Job not found." });
    await objJob.destroy();
    return objResponse.json({ message: "Job deleted.", intJobId });
  });
  return objRouter;
};
